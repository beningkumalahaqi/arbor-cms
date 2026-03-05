import { PropertyDefinition, PageContent } from "@/lib/page-types";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProperties(
  definitions: PropertyDefinition[],
  content: PageContent
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const def of definitions) {
    const value = content[def.name];

    if (def.required && (!value || value.trim() === "")) {
      errors.push({
        field: def.name,
        message: `${def.label} is required.`,
      });
    }
  }

  return errors;
}

export function buildDefaultContent(
  definitions: PropertyDefinition[]
): PageContent {
  const content: PageContent = {};
  for (const def of definitions) {
    content[def.name] = def.defaultValue ?? "";
  }
  return content;
}
