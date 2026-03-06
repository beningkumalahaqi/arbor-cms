"use client";

import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/ui";
import { FileExplorer } from "@/components/admin/file-explorer";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  createdAt?: string;
  modifiedAt?: string;
  children?: FileEntry[];
}

export default function FilesPage() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/storage?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(currentPath);
  }, [currentPath, fetchEntries]);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEntries(currentPath);
  }, [currentPath, fetchEntries]);

  const handleDelete = useCallback(async (path: string, type: string) => {
    const label = type === "directory" ? "folder" : "file";
    if (!confirm(`Are you sure you want to delete this ${label}?`)) return;

    const res = await fetch(`/api/storage?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchEntries(currentPath);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete.");
    }
  }, [currentPath, fetchEntries]);

  const handleRename = useCallback(async (path: string, currentName: string) => {
    const newName = prompt("Enter new name:", currentName);
    if (!newName || newName === currentName) return;

    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "rename",
        path,
        newName,
      }),
    });

    if (res.ok) {
      fetchEntries(currentPath);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to rename.");
    }
  }, [currentPath, fetchEntries]);

  const handleMove = useCallback(async (sourcePath: string, destFolder: string) => {
    const res = await fetch("/api/storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "move",
        sourcePath,
        destFolder,
      }),
    });

    if (res.ok) {
      fetchEntries(currentPath);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to move.");
    }
  }, [currentPath, fetchEntries]);

  return (
    <PageLayout
      title="Files"
      description="Manage files and folders in the storage directory."
    >
      {loading && entries.length === 0 ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <FileExplorer
          entries={entries}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onRefresh={handleRefresh}
          onDelete={handleDelete}
          onRename={handleRename}
          onMove={handleMove}
        />
      )}
    </PageLayout>
  );
}
