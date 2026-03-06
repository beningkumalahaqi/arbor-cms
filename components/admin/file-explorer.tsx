"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  createdAt?: string;
  modifiedAt?: string;
  children?: FileEntry[];
}

type SortField = "name" | "size" | "createdAt" | "modifiedAt";
type SortOrder = "asc" | "desc";

interface FileTreeProps {
  entries: FileEntry[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onDelete: (path: string, type: string) => void;
  onRename: (path: string, currentName: string) => void;
  onMove: (sourcePath: string, destFolder: string) => void;
}

function formatSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(name: string, type: string): string {
  if (type === "directory") return "📁";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["mp4", "mov", "avi"].includes(ext)) return "🎬";
  if (["mp3", "wav", "ogg"].includes(ext)) return "🎵";
  if (["zip", "tar", "gz"].includes(ext)) return "📦";
  return "📄";
}

function SortArrow({ field, sortBy, sortOrder }: { field: SortField; sortBy: SortField; sortOrder: SortOrder }) {
  if (field !== sortBy) {
    return <span className="ml-1 text-muted-foreground/40">↕</span>;
  }
  return (
    <span className="ml-1">
      {sortOrder === "asc" ? "↑" : "↓"}
    </span>
  );
}

function FileRow({
  entry,
  onNavigate,
  onDelete,
  onRename,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
}: {
  entry: FileEntry;
  onNavigate: (path: string) => void;
  onDelete: (path: string, type: string) => void;
  onRename: (path: string, currentName: string) => void;
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetEntry: FileEntry) => void;
  isDragOver: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, entry)}
      onDragOver={entry.type === "directory" ? onDragOver : undefined}
      onDragLeave={entry.type === "directory" ? onDragLeave : undefined}
      onDrop={entry.type === "directory" ? (e) => onDrop(e, entry) : undefined}
      className={`group grid grid-cols-[1fr_6rem_8rem_8rem_7rem] items-center gap-2 rounded-md px-3 py-2 transition-colors
        ${isDragOver ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}
        ${entry.type === "directory" ? "cursor-grab" : "cursor-grab"}`}
    >
      {/* Name */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="flex-shrink-0 text-base">
          {getFileIcon(entry.name, entry.type)}
        </span>
        {entry.type === "directory" ? (
          <button
            type="button"
            onClick={() => onNavigate(entry.path)}
            className="truncate text-left text-sm font-medium text-foreground hover:text-primary"
          >
            {entry.name}
          </button>
        ) : (
          <a
            href={`/api/storage/file/${entry.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm text-foreground/80 hover:text-primary"
          >
            {entry.name}
          </a>
        )}
      </div>

      {/* Size */}
      <span className="text-right text-xs text-muted-foreground">
        {entry.type === "file" ? formatSize(entry.size) : "—"}
      </span>

      {/* Date Added */}
      <span className="text-right text-xs text-muted-foreground">
        {formatDate(entry.createdAt)}
      </span>

      {/* Modified */}
      <span className="text-right text-xs text-muted-foreground">
        {formatDate(entry.modifiedAt)}
      </span>

      {/* Actions */}
      <div className="invisible flex flex-shrink-0 items-center justify-end gap-1 group-hover:visible">
        <button
          type="button"
          onClick={() => onRename(entry.path, entry.name)}
          className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Rename
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry.path, entry.type)}
          className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function FileExplorer({
  entries,
  currentPath,
  onNavigate,
  onRefresh,
  onDelete,
  onRename,
  onMove,
}: FileTreeProps) {
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const dragSourceRef = useRef<FileEntry | null>(null);

  const handleSort = useCallback((field: SortField) => {
    if (field === sortBy) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy]);

  const sortedEntries = useMemo(() => {
    const dirs = entries.filter((e) => e.type === "directory");
    const files = entries.filter((e) => e.type === "file");

    const compare = (a: FileEntry, b: FileEntry): number => {
      let result = 0;
      switch (sortBy) {
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "size":
          result = (a.size || 0) - (b.size || 0);
          break;
        case "createdAt":
          result = (a.createdAt || "").localeCompare(b.createdAt || "");
          break;
        case "modifiedAt":
          result = (a.modifiedAt || "").localeCompare(b.modifiedAt || "");
          break;
      }
      return sortOrder === "asc" ? result : -result;
    };

    dirs.sort(compare);
    files.sort(compare);

    // Directories always appear first
    return [...dirs, ...files];
  }, [entries, sortBy, sortOrder]);

  const handleDragStart = useCallback((e: React.DragEvent, entry: FileEntry) => {
    dragSourceRef.current = entry;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", entry.path);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPath(targetPath);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if actually leaving the element
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverPath(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetEntry: FileEntry) => {
    e.preventDefault();
    setDragOverPath(null);
    const source = dragSourceRef.current;
    if (!source) return;
    // Don't drop on itself
    if (source.path === targetEntry.path) return;
    // Don't drop into same parent (it's already there)
    const sourceParent = source.path.includes("/") ? source.path.substring(0, source.path.lastIndexOf("/")) : "";
    if (sourceParent === targetEntry.path) return;
    onMove(source.path, targetEntry.path);
    dragSourceRef.current = null;
  }, [onMove]);

  const handleDropOnParent = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);
    const source = dragSourceRef.current;
    if (!source) return;
    // Move to parent folder
    const parts = currentPath.split("/");
    parts.pop();
    const parentPath = parts.join("/");
    // Don't drop if already in parent
    const sourceParent = source.path.includes("/") ? source.path.substring(0, source.path.lastIndexOf("/")) : "";
    if (sourceParent === parentPath) return;
    onMove(source.path, parentPath);
    dragSourceRef.current = null;
  }, [currentPath, onMove]);

  const breadcrumbs = currentPath
    ? currentPath.split("/").reduce<{ label: string; path: string }[]>(
        (acc, part, i) => {
          const prevPath = i > 0 ? acc[i - 1].path : "";
          acc.push({ label: part, path: prevPath ? `${prevPath}/${part}` : part });
          return acc;
        },
        []
      )
    : [];

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createFolder",
          path: currentPath,
          name: newFolderName.trim(),
        }),
      });
      if (res.ok) {
        setNewFolderName("");
        setShowNewFolder(false);
        onRefresh();
      }
    } finally {
      setCreatingFolder(false);
    }
  }, [newFolderName, currentPath, onRefresh]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("path", currentPath);
        await fetch("/api/storage", {
          method: "POST",
          body: formData,
        });
      }
      onRefresh();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [currentPath, onRefresh]);

  const headerClasses = "cursor-pointer select-none text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setShowNewFolder(!showNewFolder)}>
          New Folder
        </Button>
        <label className={`cursor-pointer inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 text-sm ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading..." : "Upload File"}
          <input
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="rounded-md border px-3 py-1.5 text-sm bg-background text-foreground focus:border-ring focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") setShowNewFolder(false);
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} disabled={creatingFolder}>
            Create
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => onNavigate("")}
          className="font-medium text-primary hover:text-primary/80"
        >
          storage
        </button>
        {breadcrumbs.map((bc) => (
          <span key={bc.path} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <button
              type="button"
              onClick={() => onNavigate(bc.path)}
              className="font-medium text-primary hover:text-primary/80"
            >
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      {/* File List */}
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="grid grid-cols-[1fr_6rem_8rem_8rem_7rem] items-center gap-2 border-b px-3 py-2">
          <button type="button" className={`${headerClasses} text-left`} onClick={() => handleSort("name")}>
            Name <SortArrow field="name" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
          <button type="button" className={`${headerClasses} text-right`} onClick={() => handleSort("size")}>
            Size <SortArrow field="size" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
          <button type="button" className={`${headerClasses} text-right`} onClick={() => handleSort("createdAt")}>
            Added <SortArrow field="createdAt" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
          <button type="button" className={`${headerClasses} text-right`} onClick={() => handleSort("modifiedAt")}>
            Modified <SortArrow field="modifiedAt" sortBy={sortBy} sortOrder={sortOrder} />
          </button>
          <span className={`${headerClasses} text-right pointer-events-none`}>
            Actions
          </span>
        </div>

        {/* Back navigation */}
        {currentPath && (
          <button
            type="button"
            onClick={() => {
              const parts = currentPath.split("/");
              parts.pop();
              onNavigate(parts.join("/"));
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverPath("__parent__");
            }}
            onDragLeave={() => setDragOverPath(null)}
            onDrop={handleDropOnParent}
            className={`grid w-full grid-cols-[1fr_6rem_8rem_8rem_7rem] items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors
              ${dragOverPath === "__parent__" ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-accent"}`}
          >
            <div className="flex items-center gap-2">
              <span>⬆️</span>
              <span>..</span>
            </div>
            <span />
            <span />
            <span />
            <span />
          </button>
        )}

        {/* Entries */}
        <div className="py-1">
          {entries.length === 0 && !currentPath ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No files or folders yet. Create a folder or upload a file to get started.
            </div>
          ) : entries.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              This folder is empty.
            </div>
          ) : (
            sortedEntries.map((entry) => (
              <FileRow
                key={entry.path}
                entry={entry}
                onNavigate={onNavigate}
                onDelete={onDelete}
                onRename={onRename}
                onDragStart={handleDragStart}
                onDragOver={(e) => handleDragOver(e, entry.path)}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isDragOver={dragOverPath === entry.path}
              />
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag files or folders onto a folder to move them.
      </p>
    </div>
  );
}
