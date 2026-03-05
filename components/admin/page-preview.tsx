"use client";

import { getTemplate } from "@/lib/page-template";
import type { PageContent } from "@/lib/page-types";

interface PagePreviewProps {
  pageType: string;
  content: Record<string, string>;
  fullPath: string;
}

export function PagePreview({ pageType, content, fullPath }: PagePreviewProps) {
  const template = getTemplate(pageType);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        No template found for page type &quot;{pageType}&quot;.
      </div>
    );
  }

  const templateContent: PageContent = { ...content };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Preview
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {fullPath}
        </span>
      </div>
      <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950">
        {template({ content: templateContent, pageType, fullPath })}
      </div>
    </div>
  );
}
