import type { PageTemplateComponent } from "./types";
import { HomeTemplate } from "./home-template";
import { ContentTemplate } from "./content-template";
import { ArticleTemplate } from "./article-template";

const templateMap = new Map<string, PageTemplateComponent>();

function register(pageTypeName: string, template: PageTemplateComponent) {
  if (templateMap.has(pageTypeName)) {
    throw new Error(
      `Template for page type "${pageTypeName}" is already registered.`
    );
  }
  templateMap.set(pageTypeName, template);
}

// Register templates — each page type must have exactly one template
register("home", HomeTemplate);
register("content", ContentTemplate);
register("article", ArticleTemplate);

export function getTemplate(
  pageTypeName: string
): PageTemplateComponent | undefined {
  return templateMap.get(pageTypeName);
}

export function getAllTemplates(): Map<string, PageTemplateComponent> {
  return new Map(templateMap);
}
