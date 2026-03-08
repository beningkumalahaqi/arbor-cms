import type { PageTemplateProps } from "./types";
import type { WidgetAreaDefinition } from "@/lib/widgets/types";
import { WidgetArea } from "@/lib/widgets/renderer";

// ─── Widget Area Definitions for Content Template ────────────────────
export const contentAreas: WidgetAreaDefinition[] = [
  {
    name: "before-content",
    label: "Before Content",
    maxWidgets: 5,
  },
  {
    name: "after-content",
    label: "After Content",
  },
];

export function ContentTemplate({ content, pageType, fullPath, pageId, widgets = [] }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <article>
        {/* Before content widget area */}
        <WidgetArea
          area={contentAreas[0]}
          widgets={widgets}
          pageId={pageId || ""}
          fullPath={fullPath}
        />

        {content.title && (
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {content.title}
          </h1>
        )}
        {content.description && (
          <div
            className="prose mt-6 max-w-none text-foreground/80 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
        )}
        {!content.title && !content.description && widgets.length === 0 && (
          <p className="text-muted-foreground">
            This {pageType} page has no content yet.
          </p>
        )}

        {/* After content widget area */}
        <div className="mt-10">
          <WidgetArea
            area={contentAreas[1]}
            widgets={widgets}
            pageId={pageId || ""}
            fullPath={fullPath}
          />
        </div>
      </article>
    </div>
  );
}
