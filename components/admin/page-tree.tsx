"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTypeIcon } from "@/components/ui";
import { getIconByName } from "@/lib/icons";

interface TreePage {
  id: string;
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

interface TreeNodeProps {
  page: TreePage;
  children: TreePage[];
  allPages: TreePage[];
  settings: PageTypeSettingsMap;
  level: number;
}

function TreeNode({ page, children, allPages, settings, level }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;
  const iconName = settings[page.pageType]?.icon ?? "file";
  const iconDef = getIconByName(iconName);

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 ${
          level === 0 ? "" : ""
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 ${
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
        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-zinc-500 dark:text-zinc-400">
          <PageTypeIcon iconPath={iconDef?.path ?? ""} size={15} />
        </div>

        {/* Page info */}
        <Link
          href={`/admin/pages/${page.id}`}
          className="flex flex-1 items-center gap-2 truncate"
        >
          <span className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {page.pageType === "home" ? "Home" : page.slug}
          </span>
          <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
            {page.fullPath}
          </span>
        </Link>

        {/* Status + Type badges */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {page.pageType}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              page.status === "published"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {page.status}
          </span>
          <a
            href={page.fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="invisible text-xs font-medium text-blue-500 hover:text-blue-700 group-hover:visible dark:text-blue-400 dark:hover:text-blue-300"
          >
            View
          </a>
          <Link
            href={`/admin/pages/${page.id}`}
            className="invisible text-xs font-medium text-zinc-500 hover:text-zinc-700 group-hover:visible dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Edit
          </Link>
        </div>
      </div>

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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PageTree({ pages, settings }: PageTreeProps) {
  // Build tree: root pages are those with no parent
  const rootPages = pages.filter((p) => !p.parentId);

  if (pages.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
        <p className="text-zinc-500 dark:text-zinc-400">
          No pages yet. Create your first page to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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
            />
          );
        })}
      </div>
    </div>
  );
}
