import { PageTypeDefinition } from "./types";
import { homePageType } from "./home";
import { contentPageType } from "./content";

const pageTypeMap = new Map<string, PageTypeDefinition>();

function register(pageType: PageTypeDefinition) {
  if (pageTypeMap.has(pageType.name)) {
    throw new Error(`Page type "${pageType.name}" is already registered.`);
  }
  pageTypeMap.set(pageType.name, pageType);
}

// Auto-register all built-in page types
register(homePageType);
register(contentPageType);

export function getPageType(name: string): PageTypeDefinition | undefined {
  return pageTypeMap.get(name);
}

export function getAllPageTypes(): PageTypeDefinition[] {
  return Array.from(pageTypeMap.values());
}

export function isValidPageType(name: string): boolean {
  return pageTypeMap.has(name);
}
