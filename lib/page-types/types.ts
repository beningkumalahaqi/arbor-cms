export type PropertyType = "text" | "richText" | "image";

export interface PropertyDefinition {
  name: string;
  label: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: string;
}

export interface PageTypeDefinition {
  name: string;
  label: string;
  description: string;
  allowedProperties: PropertyDefinition[];
}

export interface PageContent {
  [key: string]: string;
}
