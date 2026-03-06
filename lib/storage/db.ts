import path from "path";
import { prisma } from "@/lib/db";
import { FileEntry, sanitizeName, isValidName, getMimeType } from "./types";

function normalizePath(relativePath: string): string {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.some((s) => s === "..")) {
    throw new Error("Path traversal detected.");
  }
  return segments.join("/");
}

export async function ensureStorageRoot(): Promise<void> {
  // No-op: database storage doesn't need filesystem initialization
}

export async function listDirectory(relativePath: string = ""): Promise<FileEntry[]> {
  const normalizedDir = relativePath ? normalizePath(relativePath) : "";
  const prefix = normalizedDir ? `${normalizedDir}/` : "";

  const files = await prisma.storageFile.findMany({
    where: normalizedDir
      ? { path: { startsWith: prefix } }
      : undefined,
    select: { name: true, path: true, size: true, createdAt: true, updatedAt: true },
  });

  const directFiles: FileEntry[] = files
    .filter((f) => {
      if (!normalizedDir) {
        return !f.path.includes("/");
      }
      const rest = f.path.slice(prefix.length);
      return !rest.includes("/");
    })
    .map((f) => ({
      name: f.name,
      path: f.path,
      type: "file" as const,
      size: f.size,
      createdAt: f.createdAt.toISOString(),
      modifiedAt: f.updatedAt.toISOString(),
    }));

  const folders = await prisma.storageFolder.findMany({
    where: normalizedDir
      ? { path: { startsWith: prefix } }
      : undefined,
    select: { path: true, createdAt: true },
  });

  const directFolders: FileEntry[] = folders
    .filter((f) => {
      if (!normalizedDir) {
        return !f.path.includes("/");
      }
      const rest = f.path.slice(prefix.length);
      return !rest.includes("/");
    })
    .map((f) => ({
      name: f.path.split("/").pop()!,
      path: f.path,
      type: "directory" as const,
      createdAt: f.createdAt.toISOString(),
    }));

  const result = [...directFolders, ...directFiles];

  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export async function listDirectoryTree(relativePath: string = ""): Promise<FileEntry[]> {
  const entries = await listDirectory(relativePath);
  for (const entry of entries) {
    if (entry.type === "directory") {
      entry.children = await listDirectoryTree(entry.path);
    }
  }
  return entries;
}

export async function createFolder(relativePath: string, folderName: string): Promise<void> {
  const sanitized = sanitizeName(folderName);
  if (!isValidName(sanitized)) {
    throw new Error("Invalid folder name.");
  }
  const folderPath = normalizePath(
    relativePath ? `${relativePath}/${sanitized}` : sanitized
  );

  await prisma.storageFolder.upsert({
    where: { path: folderPath },
    update: {},
    create: { path: folderPath },
  });
}

export async function saveFile(relativePath: string, fileName: string, data: Buffer): Promise<string> {
  const sanitized = sanitizeName(fileName);
  if (!isValidName(sanitized)) {
    throw new Error("Invalid file name.");
  }
  const normalizedDir = relativePath ? normalizePath(relativePath) : "";
  const filePath = normalizedDir ? `${normalizedDir}/${sanitized}` : sanitized;

  const ext = path.extname(sanitized).toLowerCase();
  const mimeType = getMimeType(ext);
  const fileData = new Uint8Array(data);

  await prisma.storageFile.upsert({
    where: { path: filePath },
    update: {
      name: sanitized,
      mimeType,
      size: data.length,
      data: fileData,
    },
    create: {
      name: sanitized,
      path: filePath,
      mimeType,
      size: data.length,
      data: fileData,
    },
  });

  return filePath;
}

export async function deleteEntry(relativePath: string): Promise<void> {
  if (!relativePath || relativePath === "" || relativePath === "/") {
    throw new Error("Cannot delete storage root.");
  }
  const normalized = normalizePath(relativePath);

  const file = await prisma.storageFile.findUnique({ where: { path: normalized } });
  if (file) {
    await prisma.storageFile.delete({ where: { path: normalized } });
    return;
  }

  const folder = await prisma.storageFolder.findUnique({ where: { path: normalized } });
  if (folder) {
    const prefix = `${normalized}/`;
    await prisma.storageFile.deleteMany({ where: { path: { startsWith: prefix } } });
    await prisma.storageFolder.deleteMany({ where: { path: { startsWith: prefix } } });
    await prisma.storageFolder.delete({ where: { path: normalized } });
    return;
  }

  throw new Error("Entry not found.");
}

export async function renameEntry(relativePath: string, newName: string): Promise<void> {
  if (!relativePath || relativePath === "" || relativePath === "/") {
    throw new Error("Cannot rename storage root.");
  }
  const sanitized = sanitizeName(newName);
  if (!isValidName(sanitized)) {
    throw new Error("Invalid name.");
  }
  const normalized = normalizePath(relativePath);
  const parentDir = normalized.includes("/")
    ? normalized.substring(0, normalized.lastIndexOf("/"))
    : "";
  const newPath = parentDir ? `${parentDir}/${sanitized}` : sanitized;

  const file = await prisma.storageFile.findUnique({ where: { path: normalized } });
  if (file) {
    await prisma.storageFile.update({
      where: { path: normalized },
      data: { name: sanitized, path: newPath },
    });
    return;
  }

  const folder = await prisma.storageFolder.findUnique({ where: { path: normalized } });
  if (folder) {
    const oldPrefix = `${normalized}/`;
    const newPrefix = `${newPath}/`;

    const childFiles = await prisma.storageFile.findMany({
      where: { path: { startsWith: oldPrefix } },
    });
    for (const f of childFiles) {
      await prisma.storageFile.update({
        where: { id: f.id },
        data: { path: newPrefix + f.path.slice(oldPrefix.length) },
      });
    }

    const childFolders = await prisma.storageFolder.findMany({
      where: { path: { startsWith: oldPrefix } },
    });
    for (const f of childFolders) {
      await prisma.storageFolder.update({
        where: { id: f.id },
        data: { path: newPrefix + f.path.slice(oldPrefix.length) },
      });
    }

    await prisma.storageFolder.update({
      where: { path: normalized },
      data: { path: newPath },
    });
    return;
  }

  throw new Error("Entry not found.");
}

export async function moveEntry(sourcePath: string, destFolderPath: string): Promise<void> {
  if (!sourcePath || sourcePath === "" || sourcePath === "/") {
    throw new Error("Cannot move storage root.");
  }
  const normalizedSource = normalizePath(sourcePath);
  const normalizedDest = destFolderPath ? normalizePath(destFolderPath) : "";
  const entryName = normalizedSource.split("/").pop()!;
  const newPath = normalizedDest ? `${normalizedDest}/${entryName}` : entryName;

  if (newPath.startsWith(normalizedSource + "/")) {
    throw new Error("Cannot move a folder into itself.");
  }

  if (normalizedDest) {
    const destFolder = await prisma.storageFolder.findUnique({
      where: { path: normalizedDest },
    });
    if (!destFolder) {
      throw new Error("Destination is not a directory.");
    }
  }

  const existingFile = await prisma.storageFile.findUnique({ where: { path: newPath } });
  const existingFolder = await prisma.storageFolder.findUnique({ where: { path: newPath } });
  if (existingFile || existingFolder) {
    throw new Error("An item with that name already exists in the destination.");
  }

  const file = await prisma.storageFile.findUnique({ where: { path: normalizedSource } });
  if (file) {
    await prisma.storageFile.update({
      where: { path: normalizedSource },
      data: { path: newPath },
    });
    return;
  }

  const folder = await prisma.storageFolder.findUnique({ where: { path: normalizedSource } });
  if (folder) {
    const oldPrefix = `${normalizedSource}/`;
    const newPrefix = `${newPath}/`;

    const childFiles = await prisma.storageFile.findMany({
      where: { path: { startsWith: oldPrefix } },
    });
    for (const f of childFiles) {
      await prisma.storageFile.update({
        where: { id: f.id },
        data: { path: newPrefix + f.path.slice(oldPrefix.length) },
      });
    }

    const childFolders = await prisma.storageFolder.findMany({
      where: { path: { startsWith: oldPrefix } },
    });
    for (const f of childFolders) {
      await prisma.storageFolder.update({
        where: { id: f.id },
        data: { path: newPrefix + f.path.slice(oldPrefix.length) },
      });
    }

    await prisma.storageFolder.update({
      where: { path: normalizedSource },
      data: { path: newPath },
    });
    return;
  }

  throw new Error("Entry not found.");
}

export async function readFile(relativePath: string): Promise<{ data: Buffer; mimeType: string }> {
  const normalized = normalizePath(relativePath);
  const file = await prisma.storageFile.findUnique({
    where: { path: normalized },
  });
  if (!file) {
    throw new Error("File not found.");
  }
  return { data: Buffer.from(file.data), mimeType: file.mimeType };
}

export async function ensurePageFolder(fullPath: string): Promise<void> {
  if (!fullPath || fullPath === "/") return;
  const folderPath = normalizePath(`pages${fullPath}`);

  await prisma.storageFolder.upsert({
    where: { path: folderPath },
    update: {},
    create: { path: folderPath },
  });
}
