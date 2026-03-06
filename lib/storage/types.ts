import path from "path";

export interface FileEntry {
  name: string;
  path: string; // relative to storage root
  type: "file" | "directory";
  size?: number;
  createdAt?: string;
  modifiedAt?: string;
  children?: FileEntry[];
}

// Characters allowed in file/folder names: alphanumeric, hyphens, underscores, dots, spaces
const SAFE_NAME_REGEX = /^[a-zA-Z0-9_\-. ]+$/;

export function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, "").trim();
}

export function isValidName(name: string): boolean {
  if (!name || name.trim() === "") return false;
  if (!SAFE_NAME_REGEX.test(name)) return false;
  if (name === "." || name === "..") return false;
  if (name.length > 255) return false;
  return true;
}

export function getMimeType(ext: string): string {
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
