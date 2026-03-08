import type { PageTemplateProps } from "./types";
import type { WidgetAreaDefinition } from "@/lib/widgets/types";
import { WidgetArea } from "@/lib/widgets/renderer";

// ─── Widget Area Definitions for Home Template ───────────────────────
export const homeAreas: WidgetAreaDefinition[] = [
  {
    name: "hero",
    label: "Hero Section",
    allowedWidgets: ["hero-banner", "heading", "rich-text", "image", "button", "spacer"],
    maxWidgets: 3,
  },
  {
    name: "main",
    label: "Main Content",
  },
];

export function HomeTemplate({ content, fullPath, pageId, widgets = [] }: PageTemplateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {/* Hero widget area */}
      <WidgetArea
        area={homeAreas[0]}
        widgets={widgets}
        pageId={pageId || ""}
        fullPath={fullPath}
      />

      {content.title && (
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          {content.title}
        </h1>
      )}
      {content.description && (
        <div
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
      )}
      {!content.title && !content.description && widgets.length === 0 && (
        <p className="text-muted-foreground">This home page has no content yet.</p>
      )}

      {/* Main widget area */}
      <div className="mt-12 w-full max-w-5xl">
        <WidgetArea
          area={homeAreas[1]}
          widgets={widgets}
          pageId={pageId || ""}
          fullPath={fullPath}
        />
      </div>
    </div>
  );
}
