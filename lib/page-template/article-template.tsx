import type { PageTemplateProps } from "./types";
import type { WidgetAreaDefinition } from "@/lib/widgets/types";
import { WidgetArea } from "@/lib/widgets/renderer";

// ─── Widget Area Definitions for Article Template ────────────────────
export const articleAreas: WidgetAreaDefinition[] = [
  {
    name: "after-banner",
    label: "After Banner",
    allowedWidgets: ["heading", "rich-text", "image", "button", "divider", "spacer", "columns", "section", "html"],
    maxWidgets: 10,
  },
  {
    name: "after-content",
    label: "After Content",
  },
];

export function ArticleTemplate({ content, fullPath, pageId, widgets = [] }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <article>
        {/* Title */}
        {content.title && (
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {content.title}
          </h1>
        )}

        {/* Image Banner */}
        {content.imageBanner && (
          <div className="mt-8 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/storage/file/${content.imageBanner}`}
              alt={content.title || "Article banner"}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* After banner widget area */}
        <div className="mt-8">
          <WidgetArea
            area={articleAreas[0]}
            widgets={widgets}
            pageId={pageId || ""}
            fullPath={fullPath}
          />
        </div>

        {/* Content */}
        {content.content && (
          <div
            className="prose prose-lg mt-10 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}

        {!content.title && !content.imageBanner && !content.content && widgets.length === 0 && (
          <p className="text-muted-foreground">This article has no content yet.</p>
        )}

        {/* After content widget area */}
        <div className="mt-10">
          <WidgetArea
            area={articleAreas[1]}
            widgets={widgets}
            pageId={pageId || ""}
            fullPath={fullPath}
          />
        </div>
      </article>
    </div>
  );
}
