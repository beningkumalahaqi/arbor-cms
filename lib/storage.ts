import path from "path";
import fs from "fs/promises";

const STORAGE_ROOT = path.join(process.cwd(), "storage");

// Characters allowed in file/folder names: alphanumeric, hyphens, underscores, dots, spaces
const SAFE_NAME_REGEX = /^[a-zA-Z0-9_\-. ]+$/;

export interface FileEntry {
  name: string;
  path: string; // relative to storage root
  type: "file" | "directory";
  size?: number;
  createdAt?: string;
  modifiedAt?: string;
  children?: FileEntry[];
}

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, "").trim();
}

function isValidName(name: string): boolean {
  if (!name || name.trim() === "") return false;
  if (!SAFE_NAME_REGEX.test(name)) return false;
  if (name === "." || name === "..") return false;
  if (name.length > 255) return false;
  return true;
}

function resolveStoragePath(relativePath: string): string {
  // Normalize and resolve the path
  const resolved = path.resolve(STORAGE_ROOT, relativePath);
  // Ensure it stays within the storage root (prevent path traversal)
  if (!resolved.startsWith(STORAGE_ROOT)) {
    throw new Error("Path traversal detected.");
  }
  return resolved;
}

export async function ensureStorageRoot(): Promise<void> {
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
}

export async function listDirectory(relativePath: string = ""): Promise<FileEntry[]> {
  const dirPath = resolveStoragePath(relativePath);
  await fs.mkdir(dirPath, { recursive: true });

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result: FileEntry[] = [];

  for (const entry of entries) {
    const entryRelPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const stat = await fs.stat(path.join(dirPath, entry.name));
    if (entry.isDirectory()) {
      result.push({
        name: entry.name,
        path: entryRelPath,
        type: "directory",
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
      });
    } else if (entry.isFile()) {
      result.push({
        name: entry.name,
        path: entryRelPath,
        type: "file",
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }

  // Sort: directories first, then files, both alphabetical
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
  const targetPath = resolveStoragePath(relativePath ? `${relativePath}/${sanitized}` : sanitized);
  await fs.mkdir(targetPath, { recursive: true });
}

export async function saveFile(relativePath: string, fileName: string, data: Buffer): Promise<string> {
  const sanitized = sanitizeName(fileName);
  if (!isValidName(sanitized)) {
    throw new Error("Invalid file name.");
  }
  const dirPath = resolveStoragePath(relativePath);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = path.join(dirPath, sanitized);
  // Ensure the file path is still within storage root
  if (!filePath.startsWith(STORAGE_ROOT)) {
    throw new Error("Path traversal detected.");
  }
  await fs.writeFile(filePath, data);
  return relativePath ? `${relativePath}/${sanitized}` : sanitized;
}

export async function deleteEntry(relativePath: string): Promise<void> {
  if (!relativePath || relativePath === "" || relativePath === "/") {
    throw new Error("Cannot delete storage root.");
  }
  const targetPath = resolveStoragePath(relativePath);
  const stat = await fs.stat(targetPath);
  if (stat.isDirectory()) {
    await fs.rm(targetPath, { recursive: true, force: true });
  } else {
    await fs.unlink(targetPath);
  }
}

export async function renameEntry(relativePath: string, newName: string): Promise<void> {
  if (!relativePath || relativePath === "" || relativePath === "/") {
    throw new Error("Cannot rename storage root.");
  }
  const sanitized = sanitizeName(newName);
  if (!isValidName(sanitized)) {
    throw new Error("Invalid name.");
  }
  const oldPath = resolveStoragePath(relativePath);
  const parentDir = path.dirname(oldPath);
  const newPath = path.join(parentDir, sanitized);
  // Ensure new path is still within storage root
  if (!newPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Path traversal detected.");
  }
  await fs.rename(oldPath, newPath);
}

export async function moveEntry(sourcePath: string, destFolderPath: string): Promise<void> {
  if (!sourcePath || sourcePath === "" || sourcePath === "/") {
    throw new Error("Cannot move storage root.");
  }
  const oldFullPath = resolveStoragePath(sourcePath);
  const fileName = path.basename(oldFullPath);
  const destDir = resolveStoragePath(destFolderPath);
  const newFullPath = path.join(destDir, fileName);
  // Ensure new path stays within storage root
  if (!newFullPath.startsWith(STORAGE_ROOT)) {
    throw new Error("Path traversal detected.");
  }
  // Ensure destination is a directory
  const destStat = await fs.stat(destDir);
  if (!destStat.isDirectory()) {
    throw new Error("Destination is not a directory.");
  }
  // Prevent moving a folder into itself
  if (newFullPath.startsWith(oldFullPath + path.sep)) {
    throw new Error("Cannot move a folder into itself.");
  }
  // Check if target already exists
  try {
    await fs.access(newFullPath);
    throw new Error("An item with that name already exists in the destination.");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  await fs.rename(oldFullPath, newFullPath);
}

export async function readFile(relativePath: string): Promise<{ data: Buffer; mimeType: string }> {
  const filePath = resolveStoragePath(relativePath);
  const data = await fs.readFile(filePath);
  const ext = path.extname(relativePath).toLowerCase();
  const mimeType = getMimeType(ext);
  return { data, mimeType };
}

export async function ensurePageFolder(fullPath: string): Promise<void> {
  if (!fullPath || fullPath === "/") return;
  // Convert page path to folder path: /about/team -> pages/about/team
  const folderPath = `pages${fullPath}`;
  const targetPath = resolveStoragePath(folderPath);
  try {
    await fs.access(targetPath);
    // Folder already exists
  } catch {
    await fs.mkdir(targetPath, { recursive: true });
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".bmp": "image/bmp",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".xml": "application/xml",
    ".zip": "application/zip",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export function isImageFile(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"].includes(ext);
}

export { STORAGE_ROOT, resolveStoragePath as _resolveForTest };
