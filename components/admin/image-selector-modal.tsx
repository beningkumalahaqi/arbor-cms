"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileEntry[];
}

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imagePath: string) => void;
  currentValue?: string;
}

function ImageGrid({
  entries,
  currentPath,
  onNavigate,
  onSelect,
  selectedPath,
}: {
  entries: FileEntry[];
  currentPath: string;
  onNavigate: (path: string) => void;
  onSelect: (path: string) => void;
  selectedPath: string;
}) {
  return (
    <div>
      {/* Breadcrumbs */}
      <div className="mb-3 flex items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => onNavigate("")}
          className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          storage
        </button>
        {currentPath.split("/").filter(Boolean).reduce<{ label: string; path: string }[]>((acc, part, i) => {
          const prevPath = i > 0 ? acc[i - 1].path : "";
          acc.push({ label: part, path: prevPath ? `${prevPath}/${part}` : part });
          return acc;
        }, []).map((bc) => (
          <span key={bc.path} className="flex items-center gap-1">
            <span className="text-zinc-400">/</span>
            <button
              type="button"
              onClick={() => onNavigate(bc.path)}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              {bc.label}
            </button>
          </span>
        ))}
      </div>

      {/* Back button */}
      {currentPath && (
        <button
          type="button"
          onClick={() => {
            const parts = currentPath.split("/");
            parts.pop();
            onNavigate(parts.join("/"));
          }}
          className="mb-2 flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          ⬆️ Back
        </button>
      )}

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-zinc-400">
          No images found in this folder.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {entries.map((entry) => {
            if (entry.type === "directory") {
              return (
                <button
                  key={entry.path}
                  type="button"
                  onClick={() => onNavigate(entry.path)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  <span className="text-2xl">📁</span>
                  <span className="w-full truncate text-center text-xs text-zinc-600 dark:text-zinc-400">
                    {entry.name}
                  </span>
                </button>
              );
            }

            const isSelected = selectedPath === entry.path;
            return (
              <button
                key={entry.path}
                type="button"
                onClick={() => onSelect(entry.path)}
                className={`group relative flex flex-col items-center gap-1 overflow-hidden rounded-lg border-2 p-1 transition-all ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                <div className="relative aspect-square w-full overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/storage/file/${entry.path}`}
                    alt={entry.name}
                    className="h-full w-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
                <span className="w-full truncate text-center text-xs text-zinc-600 dark:text-zinc-400">
                  {entry.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ImageSelectorModal({
  isOpen,
  onClose,
  onSelect,
  currentValue,
}: ImageSelectorModalProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedPath, setSelectedPath] = useState(currentValue || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchEntries = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/storage?path=${encodeURIComponent(path)}&imagesOnly=true`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPath(currentValue || "");
      fetchEntries(currentPath);
    }
  }, [isOpen, currentPath, currentValue, fetchEntries]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate all files are images
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        alert("Only image files can be uploaded here.");
        return;
      }
    }

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
      fetchEntries(currentPath);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, [currentPath, fetchEntries]);

  const handleConfirm = useCallback(() => {
    if (selectedPath) {
      onSelect(selectedPath);
      onClose();
    }
  }, [selectedPath, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Select Image
          </h2>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <span className="inline-flex cursor-pointer items-center rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                {uploading ? "Uploading..." : "Upload Image"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-8 text-center text-sm text-zinc-400">Loading...</div>
          ) : (
            <ImageGrid
              entries={entries}
              currentPath={currentPath}
              onNavigate={setCurrentPath}
              onSelect={setSelectedPath}
              selectedPath={selectedPath}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="truncate text-sm text-zinc-500">
            {selectedPath ? `Selected: ${selectedPath}` : "No image selected"}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedPath}>
              Select
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
