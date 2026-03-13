"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageTypeIcon } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { getIconByName } from "@/lib/icons";

interface TreePage {
  id: string;
  slug: string;
  fullPath: string;
  name: string;
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
  onRefresh?: () => void;
}

// ─── Context Menu ────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  page: TreePage;
}

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onCopy: (page: TreePage) => void;
  onDelete: (page: TreePage) => void;
}

function ContextMenu({ menu, onClose, onCopy, onDelete }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ top: menu.y, left: menu.x }}
      className="fixed z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md text-sm text-popover-foreground"
    >
      <a
        href={menu.page.fullPath}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
        View Live
      </a>
      <Link
        href={`/admin/pages/${menu.page.id}`}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
        onClick={onClose}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        Edit
      </Link>
      <button
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
        onClick={() => { onCopy(menu.page); onClose(); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
        Copy Page
      </button>
      <div className="my-1 border-t" />
      <button
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-accent text-destructive cursor-pointer"
        onClick={() => { onDelete(menu.page); onClose(); }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>
        Delete
      </button>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  page: TreePage;
  children: TreePage[];
  allPages: TreePage[];
  settings: PageTypeSettingsMap;
  level: number;
  onContextMenu: (e: React.MouseEvent, page: TreePage) => void;
  draggingId: string | null;
  dropTarget: DropTarget | null;
  onDragStart: (e: React.DragEvent, page: TreePage) => void;
  onDragOver: (e: React.DragEvent, page: TreePage, position: "before" | "inside" | "after") => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, page: TreePage, position: "before" | "inside" | "after") => void;
  onDragEnd: () => void;
}

interface DropTarget {
  pageId: string;
  position: "before" | "inside" | "after";
}

function TreeNode({
  page,
  children,
  allPages,
  settings,
  level,
  onContextMenu,
  draggingId,
  dropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const iconName = settings[page.pageType]?.icon ?? "file";
  const iconDef = getIconByName(iconName);
  const isDragging = draggingId === page.id;

  const displayName =
    page.name || (page.pageType === "home" ? "Home" : page.slug);

  const isDropBefore = dropTarget?.pageId === page.id && dropTarget.position === "before";
  const isDropInside = dropTarget?.pageId === page.id && dropTarget.position === "inside";
  const isDropAfter = dropTarget?.pageId === page.id && dropTarget.position === "after";

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    let position: "before" | "inside" | "after";
    if (y < h * 0.25) position = "before";
    else if (y > h * 0.75) position = "after";
    else position = "inside";
    onDragOver(e, page, position);
  }

  return (
    <div>
      {/* Drop indicator: before */}
      {isDropBefore && (
        <div
          style={{ marginLeft: `${level * 20 + 8}px` }}
          className="h-0.5 bg-primary rounded-full mx-2"
        />
      )}

      <div
        draggable={page.pageType !== "home"}
        onDragStart={(e) => onDragStart(e, page)}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const y = e.clientY - rect.top;
          const h = rect.height;
          let position: "before" | "inside" | "after";
          if (y < h * 0.25) position = "before";
          else if (y > h * 0.75) position = "after";
          else position = "inside";
          onDrop(e, page, position);
        }}
        onDragEnd={onDragEnd}
        onContextMenu={(e) => onContextMenu(e, page)}
        className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors select-none
          ${isDragging ? "opacity-40" : ""}
          ${isDropInside ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-accent"}
          ${page.pageType !== "home" ? "cursor-grab active:cursor-grabbing" : ""}
        `}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
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

      {/* Drop indicator: after */}
      {isDropAfter && (
        <div
          style={{ marginLeft: `${level * 20 + 8}px` }}
          className="h-0.5 bg-primary rounded-full mx-2"
        />
      )}

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => {
            const grandchildren = allPages.filter(
              (p) => p.parentId === child.id
            );
            return (
              <TreeNode
                key={child.id}
                page={child}
                children={grandchildren}
                allPages={allPages}
                settings={settings}
                level={level + 1}
                onContextMenu={onContextMenu}
                draggingId={draggingId}
                dropTarget={dropTarget}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page Tree ────────────────────────────────────────────────────────────────

export function PageTree({ pages, settings, onRefresh }: PageTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, page: TreePage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, page });
  }, []);

  const handleCopy = useCallback(async (page: TreePage) => {
    setCopyingId(page.id);
    try {
      const res = await fetch(`/api/pages/${page.id}/copy`, { method: "POST" });
      if (res.ok) {
        onRefresh?.();
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to copy page.");
      }
    } finally {
      setCopyingId(null);
    }
  }, [onRefresh]);

  const handleDelete = useCallback(async (page: TreePage) => {
    if (!confirm(`Are you sure you want to delete "${page.name || page.slug}"?`)) return;
    const res = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (res.ok) {
      onRefresh?.();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete page.");
    }
  }, [onRefresh]);

  const handleDragStart = useCallback((e: React.DragEvent, page: TreePage) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", page.id);
    setDraggingId(page.id);
  }, []);

  const handleDragOver = useCallback((
    e: React.DragEvent,
    page: TreePage,
    position: "before" | "inside" | "after"
  ) => {
    e.preventDefault();
    setDropTarget({ pageId: page.id, position });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(async (
    e: React.DragEvent,
    targetPage: TreePage,
    position: "before" | "inside" | "after"
  ) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");
    setDropTarget(null);
    setDraggingId(null);

    if (!sourceId || sourceId === targetPage.id) return;

    let newParentId: string | null;
    let sortOrder: number | undefined;

    if (position === "inside") {
      newParentId = targetPage.id;
      sortOrder = 0;
    } else if (position === "before") {
      newParentId = targetPage.parentId;
      sortOrder = Math.max(0, targetPage.sortOrder - 1);
    } else {
      // after
      newParentId = targetPage.parentId;
      sortOrder = targetPage.sortOrder + 1;
    }

    const res = await fetch("/api/pages/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sourceId, newParentId, sortOrder }),
    });

    if (res.ok) {
      onRefresh?.();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to move page.");
    }
  }, [onRefresh]);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  // Build tree: root pages are those with no parent
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
    <>
      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onCopy={handleCopy}
          onDelete={handleDelete}
        />
      )}
      {copyingId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/60">
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground shadow-md">
            Copying page…
          </div>
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
                children={children}
                allPages={pages}
                settings={settings}
                level={0}
                onContextMenu={handleContextMenu}
                draggingId={draggingId}
                dropTarget={dropTarget}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tip: Right-click any page for options. Drag pages to move them.
      </p>
    </>
  );
}
