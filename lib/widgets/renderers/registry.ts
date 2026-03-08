// ─── Widget Renderer Registry ─────────────────────────────────────────
// Maps widget type names to React renderer components.
// Same pattern as lib/page-template/registry.ts.
// To add a new renderer: create component file, import here, register.

import type { WidgetInstance } from "../types";

// Base renderer props — all renderers receive at least these.
// Container renderers (section, columns) receive additional props
// (allWidgets, renderWidget) via the WidgetItem switch statement.
export type WidgetRendererComponent = (props: {
  widget: WidgetInstance;
  pageId: string;
  fullPath: string;
  allWidgets?: WidgetInstance[];
  renderWidget?: (widget: WidgetInstance) => React.ReactNode;
}) => React.JSX.Element | null;

const rendererMap = new Map<string, WidgetRendererComponent>();

function register(widgetType: string, renderer: WidgetRendererComponent) {
  if (rendererMap.has(widgetType)) {
    throw new Error(`Renderer for widget type "${widgetType}" is already registered.`);
  }
  rendererMap.set(widgetType, renderer);
}

// ─── Import and register all built-in renderers ───────────────────────
import { HeadingRenderer } from "./heading-renderer";
import { RichTextRenderer } from "./rich-text-renderer";
import { ImageRenderer } from "./image-renderer";
import { ButtonRenderer } from "./button-renderer";
import { SectionRenderer } from "./section-renderer";
import { ColumnsRenderer } from "./columns-renderer";
import { SpacerRenderer } from "./spacer-renderer";
import { DividerRenderer } from "./divider-renderer";
import { PageListRenderer } from "./page-list-renderer";
import { FormRenderer } from "./form-renderer";
import { HtmlRenderer } from "./html-renderer";
import { HeroBannerRenderer } from "./hero-banner-renderer";

register("heading", HeadingRenderer);
register("rich-text", RichTextRenderer);
register("image", ImageRenderer);
register("button", ButtonRenderer);
register("section", SectionRenderer);
register("columns", ColumnsRenderer);
register("spacer", SpacerRenderer);
register("divider", DividerRenderer);
register("page-list", PageListRenderer);
register("form", FormRenderer);
register("html", HtmlRenderer);
register("hero-banner", HeroBannerRenderer);

// ─── Public API ───────────────────────────────────────────────────────

export function getWidgetRenderer(widgetType: string): WidgetRendererComponent | undefined {
  return rendererMap.get(widgetType);
}

export function getAllWidgetRenderers(): Map<string, WidgetRendererComponent> {
  return new Map(rendererMap);
}
