import type { PageTemplateComponent, TemplateRegistration } from "./types";
import type { WidgetAreaDefinition } from "@/lib/widgets/types";
import { HomeTemplate, homeAreas } from "./home-template";
import { ContentTemplate, contentAreas } from "./content-template";
import { ArticleTemplate, articleAreas } from "./article-template";

const templateMap = new Map<string, TemplateRegistration>();

function register(
  pageTypeName: string,
  template: PageTemplateComponent,
  areas: WidgetAreaDefinition[] = []
) {
  if (templateMap.has(pageTypeName)) {
    throw new Error(
      `Template for page type "${pageTypeName}" is already registered.`
    );
  }
  templateMap.set(pageTypeName, { component: template, areas });
}

// Register templates — each page type must have exactly one template
register("home", HomeTemplate, homeAreas);
register("content", ContentTemplate, contentAreas);
register("article", ArticleTemplate, articleAreas);

export function getTemplate(
  pageTypeName: string
): PageTemplateComponent | undefined {
  const reg = templateMap.get(pageTypeName);
  return reg?.component;
}

export function getTemplateAreas(
  pageTypeName: string
): WidgetAreaDefinition[] {
  const reg = templateMap.get(pageTypeName);
  return reg?.areas ?? [];
}

export function getTemplateRegistration(
  pageTypeName: string
): TemplateRegistration | undefined {
  return templateMap.get(pageTypeName);
}

export function getAllTemplates(): Map<string, PageTemplateComponent> {
  const result = new Map<string, PageTemplateComponent>();
  for (const [key, reg] of templateMap) {
    result.set(key, reg.component);
  }
  return result;
}
