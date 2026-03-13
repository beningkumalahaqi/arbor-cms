"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTypeIcon } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { getIconByName } from "@/lib/icons";

interface TreePage {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  pageType: string;
  status: string;
  parentId: string | null;
  sortOrder: number;
}

interface PageTypeSettingsMap {
  [pageTypeName: string]: {
    icon: string;
    allowedChildren: string[];
  };
}

interface PageTreeProps {
  pages: TreePage[];
  settings: PageTypeSettingsMap;
}

interface ContextMenu {
  x: number;
  y: number;
  page: TreePage;
}

interface TreeNodeProps {
  page: TreePage;
  childPages: TreePage[];
  allPages: TreePage[];
  settings: PageTypeSettingsMap;
  level: number;
  dragSource: React.MutableRefObject<TreePage | null>;
  dropTargetId: string | null;
  onDragStart: (page: TreePage) => void;
  onDragOver: (e: React.DragEvent, pageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetPage: TreePage) => void;
  onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent, page: TreePage) => void;
}

function TreeNode({
  page,
  childPages,
  allPages,
  settings,
  level,
  dragSource,
  dropTargetId,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onContextMenu,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = childPages.length > 0;
  const iconName = settings[page.pageType]?.icon ?? "file";
  const iconDef = getIconByName(iconName);

  const isDragging = dragSource.current?.id === page.id;
  const isDropTarget = dropTargetId === page.id;
  const displayName = page.name || (page.pageType === "home" ? "Home" : page.slug);

  return (
    <div>
      <div
        draggable={page.pageType !== "home"}
        onDragStart={() => onDragStart(page)}
        onDragOver={(e) => onDragOver(e, page.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, page)}
        onDragEnd={onDragEnd}
        onContextMenu={(e) => onContextMenu(e, page)}
        className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors cursor-pointer select-none
          ${isDragging ? "opacity-40" : ""}
          ${isDropTarget ? "ring-2 ring-primary bg-primary/10" : "hover:bg-accent"}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground ${
            hasChildren ? "visible" : "invisible"
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path
              d="M4.5 2L8.5 6L4.5 10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Drag handle (visible on hover, hidden for home) */}
        {page.pageType !== "home" && (
          <div className="invisible group-hover:visible flex-shrink-0 text-muted-foreground cursor-grab active:cursor-grabbing">
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="4" cy="4" r="1.5" />
              <circle cx="8" cy="4" r="1.5" />
              <circle cx="4" cy="8" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="4" cy="12" r="1.5" />
              <circle cx="8" cy="12" r="1.5" />
            </svg>
          </div>
        )}
        {page.pageType === "home" && <div className="w-3 flex-shrink-0" />}

        {/* Icon */}
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground">
          <PageTypeIcon iconPath={iconDef?.path ?? ""} size={15} />
        </div>

        {/* Page info */}
        <Link
          href={`/admin/pages/${page.id}`}
          className="flex flex-1 items-center gap-2 truncate"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="truncate text-sm font-medium text-foreground">
            {displayName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {page.fullPath}
          </span>
        </Link>

        {/* Status + Type badges */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            {page.pageType}
          </Badge>
          <Badge variant={page.status === "published" ? "default" : "outline"} className="text-[10px]">
            {page.status}
          </Badge>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {childPages.map((child) => {
            const grandchildren = allPages.filter(
              (p) => p.parentId === child.id
            );
            return (
              <TreeNode
                key={child.id}
                page={child}
                childPages={grandchildren}
                allPages={allPages}
                settings={settings}
                level={level + 1}
                dragSource={dragSource}
                dropTargetId={dropTargetId}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                onContextMenu={onContextMenu}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PageTree({ pages: initialPages, settings }: PageTreeProps) {
  const [pages, setPages] = useState<TreePage[]>(initialPages);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const dragSource = useRef<TreePage | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Sync when parent updates pages
  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, page: TreePage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, page });
  }, []);

  const handleDragStart = useCallback((page: TreePage) => {
    dragSource.current = page;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    if (dragSource.current && dragSource.current.id !== pageId) {
      setDropTargetId(pageId);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragSource.current = null;
    setDropTargetId(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetPage: TreePage) => {
    e.preventDefault();
    setDropTargetId(null);
    const source = dragSource.current;
    dragSource.current = null;

    if (!source || source.id === targetPage.id) return;
    if (source.pageType === "home") return;

    // Drop onto a page = move source to be a child of targetPage
    const newParentId = targetPage.id;

    setActionError("");
    const res = await fetch(`/api/pages/${source.id}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newParentId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Failed to move page.");
      return;
    }

    // Refresh pages list
    const listRes = await fetch("/api/pages?tree=true");
    const listData = await listRes.json();
    if (listData.pages) {
      setPages(listData.pages);
    }
  }, []);

  async function handleCopy(page: TreePage) {
    setContextMenu(null);
    setActionError("");
    const res = await fetch(`/api/pages/${page.id}/copy`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Failed to copy page.");
      return;
    }
    // Refresh
    const listRes = await fetch("/api/pages?tree=true");
    const listData = await listRes.json();
    if (listData.pages) setPages(listData.pages);
  }

  async function handleDelete(page: TreePage) {
    setContextMenu(null);
    if (!confirm(`Delete "${page.name || page.slug || "this page"}"? This cannot be undone.`)) return;
    setActionError("");
    const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setActionError(data.error ?? "Failed to delete page.");
      return;
    }
    const listRes = await fetch("/api/pages?tree=true");
    const listData = await listRes.json();
    if (listData.pages) setPages(listData.pages);
  }

  const rootPages = pages.filter((p) => !p.parentId);

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          No pages yet. Create your first page to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {actionError && (
        <div className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="flex items-center border-b px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span className="flex-1">Page</span>
          <span className="w-32 text-right">Type / Status</span>
        </div>

        {/* Tree */}
        <div className="py-1">
          {rootPages.map((page) => {
            const children = pages.filter((p) => p.parentId === page.id);
            return (
              <TreeNode
                key={page.id}
                page={page}
                childPages={children}
                allPages={pages}
                settings={settings}
                level={0}
                dragSource={dragSource}
                dropTargetId={dropTargetId}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onContextMenu={handleContextMenu}
              />
            );
          })}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <Link
            href={`/admin/pages/${contextMenu.page.id}`}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setContextMenu(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </Link>
          <a
            href={contextMenu.page.fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setContextMenu(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            View Live
          </a>
          {contextMenu.page.pageType !== "home" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              onClick={() => handleCopy(contextMenu.page)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
          )}
          <div className="my-1 border-t" />
          {contextMenu.page.pageType !== "home" && (
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(contextMenu.page)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
