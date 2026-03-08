"use client";

import { getTemplate } from "@/lib/page-template";
import type { PageContent } from "@/lib/page-types";
import type { WidgetInstance } from "@/lib/widgets/types";

interface PagePreviewProps {
  pageType: string;
  content: Record<string, string>;
  fullPath: string;
  pageId?: string;
  widgets?: WidgetInstance[];
}

export function PagePreview({ pageType, content, fullPath, pageId, widgets }: PagePreviewProps) {
  const template = getTemplate(pageType);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No template found for page type &quot;{pageType}&quot;.
      </div>
    );
  }

  const templateContent: PageContent = { ...content };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Preview
        </span>
        <span className="text-xs text-muted-foreground">
          {fullPath}
        </span>
      </div>
      <div className="flex-1 overflow-auto bg-background">
        {template({ content: templateContent, pageType, fullPath, pageId, widgets })}
      </div>
    </div>
  );
}
