"use client";

import type { WidgetInstance, WidgetAreaDefinition } from "./types";
import { HeadingRenderer } from "./renderers/heading-renderer";
import { RichTextRenderer } from "./renderers/rich-text-renderer";
import { ImageRenderer } from "./renderers/image-renderer";
import { ButtonRenderer } from "./renderers/button-renderer";
import { SectionRenderer } from "./renderers/section-renderer";
import { ColumnsRenderer } from "./renderers/columns-renderer";
import { SpacerRenderer } from "./renderers/spacer-renderer";
import { DividerRenderer } from "./renderers/divider-renderer";
import { PageListRenderer } from "./renderers/page-list-renderer";
import { FormRenderer } from "./renderers/form-renderer";
import { HtmlRenderer } from "./renderers/html-renderer";
import { HeroBannerRenderer } from "./renderers/hero-banner-renderer";

export { getWidgetRenderer, getAllWidgetRenderers } from "./renderers/registry";
export type { WidgetRendererComponent } from "./renderers/registry";

// ─── Single Widget Renderer ──────────────────────────────────────────
// Renders a single widget instance by directly switching on the type.
// Container widgets (section, columns) receive allWidgets + renderWidget
// to recursively render their children.

interface WidgetItemProps {
  widget: WidgetInstance;
  pageId: string;
  fullPath: string;
  allWidgets: WidgetInstance[];
}

export function WidgetItem({ widget, pageId, fullPath, allWidgets }: WidgetItemProps) {
  const p = { widget, pageId, fullPath };

  // Render callback for container widgets to recursively render children
  function renderWidget(child: WidgetInstance) {
    return (
      <WidgetItem
        widget={child}
        pageId={pageId}
        fullPath={fullPath}
        allWidgets={allWidgets}
      />
    );
  }

  switch (widget.type) {
    case "heading": return <HeadingRenderer {...p} />;
    case "rich-text": return <RichTextRenderer {...p} />;
    case "image": return <ImageRenderer {...p} />;
    case "button": return <ButtonRenderer {...p} />;
    case "section": return <SectionRenderer {...p} allWidgets={allWidgets} renderWidget={renderWidget} />;
    case "columns": return <ColumnsRenderer {...p} allWidgets={allWidgets} renderWidget={renderWidget} />;
    case "spacer": return <SpacerRenderer {...p} />;
    case "divider": return <DividerRenderer {...p} />;
    case "page-list": return <PageListRenderer {...p} />;
    case "form": return <FormRenderer {...p} />;
    case "html": return <HtmlRenderer {...p} />;
    case "hero-banner": return <HeroBannerRenderer {...p} />;
    default:
      return (
        <div className="rounded-md border border-dashed border-destructive/50 p-4 text-sm text-destructive">
          Unknown widget type: &quot;{widget.type}&quot;
        </div>
      );
  }
}

// ─── Widget Area Renderer ────────────────────────────────────────────
// Renders all top-level widgets for a specific area. Used in page templates.

interface WidgetAreaProps {
  area: WidgetAreaDefinition;
  widgets: WidgetInstance[];
  pageId: string;
  fullPath: string;
}

export function WidgetArea({ area, widgets, pageId, fullPath }: WidgetAreaProps) {
  // Only render top-level widgets (no parent) in this area
  const areaWidgets = widgets
    .filter((w) => w.area === area.name && !w.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (areaWidgets.length === 0) {
    return null;
  }

  return (
    <div data-widget-area={area.name} className="space-y-6">
      {areaWidgets.map((widget) => (
        <WidgetItem
          key={widget.id}
          widget={widget}
          pageId={pageId}
          fullPath={fullPath}
          allWidgets={widgets}
        />
      ))}
    </div>
  );
}
