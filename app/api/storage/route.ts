import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  listDirectory,
  listDirectoryTree,
  createFolder,
  saveFile,
  deleteEntry,
  renameEntry,
  moveEntry,
  ensureStorageRoot,
} from "@/lib/storage";

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Disallowed extensions for security
const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".mjs",
  ".cjs", ".php", ".py", ".rb", ".pl", ".jar", ".war",
];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureStorageRoot();

  const { searchParams } = new URL(request.url);
  const dir = searchParams.get("path") || "";
  const tree = searchParams.get("tree") === "true";
  const imagesOnly = searchParams.get("imagesOnly") === "true";

  try {
    let entries;
    if (tree) {
      entries = await listDirectoryTree(dir);
    } else {
      entries = await listDirectory(dir);
    }

    // Filter images only if requested
    if (imagesOnly) {
      entries = filterImages(entries);
    }

    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list directory.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function filterImages(entries: Array<{ name: string; type: string; children?: unknown[] }>): typeof entries {
  return entries
    .map((entry) => {
      if (entry.type === "directory") {
        const filtered = filterImages((entry.children || []) as typeof entries);
        if (filtered.length > 0) {
          return { ...entry, children: filtered };
        }
        return null;
      }
      // Check if it's an image file
      const ext = entry.name.split(".").pop()?.toLowerCase() || "";
      if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)) {
        return entry;
      }
      return null;
    })
    .filter(Boolean) as typeof entries;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureStorageRoot();

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // Create folder or rename
    const body = await request.json();
    const { action, path: dirPath, name, newName } = body;

    if (action === "createFolder") {
      if (!name) {
        return NextResponse.json({ error: "Folder name is required." }, { status: 400 });
      }
      try {
        await createFolder(dirPath || "", name);
        return NextResponse.json({ success: true }, { status: 201 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create folder.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (action === "rename") {
      if (!dirPath || !newName) {
        return NextResponse.json({ error: "Path and new name are required." }, { status: 400 });
      }
      try {
        await renameEntry(dirPath, newName);
        return NextResponse.json({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to rename.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    if (action === "move") {
      const { sourcePath, destFolder } = body;
      if (!sourcePath || destFolder === undefined) {
        return NextResponse.json({ error: "Source path and destination folder are required." }, { status: 400 });
      }
      try {
        await moveEntry(sourcePath, destFolder);
        return NextResponse.json({ success: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to move.";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  if (contentType.includes("multipart/form-data")) {
    // File upload
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dirPath = (formData.get("path") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
    }

    // Check blocked extensions
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "This file type is not allowed for security reasons." },
        { status: 400 }
      );
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const savedPath = await saveFile(dirPath, file.name, buffer);
      return NextResponse.json({ path: savedPath }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload file.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Unsupported content type." }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Path is required." }, { status: 400 });
  }

  try {
    await deleteEntry(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
