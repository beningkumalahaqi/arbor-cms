import type { PageContent } from "@/lib/page-types/types";
import type { WidgetAreaDefinition, WidgetInstance } from "@/lib/widgets/types";

export interface PageTemplateProps {
  content: PageContent;
  pageType: string;
  fullPath: string;
  pageId?: string;
  widgets?: WidgetInstance[];
}

export type PageTemplateComponent = (props: PageTemplateProps) => React.JSX.Element;

// ─── Template Area Configuration ─────────────────────────────────────
// Each template can export widget area definitions.
// These are registered alongside the template component.

export interface TemplateRegistration {
  component: PageTemplateComponent;
  areas: WidgetAreaDefinition[];
}
