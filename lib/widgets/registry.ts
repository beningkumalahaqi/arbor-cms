import type { WidgetDefinition, WidgetPropDefinition } from "./types";

// ─── Widget Registry ──────────────────────────────────────────────────
// Same pattern as lib/page-types/registry.ts.
// To add a new widget: create a definition file, import it here, and call register().

const widgetMap = new Map<string, WidgetDefinition>();

function register(widget: WidgetDefinition) {
  if (widgetMap.has(widget.type)) {
    throw new Error(`Widget type "${widget.type}" is already registered.`);
  }
  widgetMap.set(widget.type, widget);
}

// ─── Import and register all built-in widgets ─────────────────────────
import { headingWidget } from "./definitions/heading";
import { richTextWidget } from "./definitions/rich-text";
import { imageWidget } from "./definitions/image";
import { buttonWidget } from "./definitions/button";
import { sectionWidget } from "./definitions/section";
import { columnsWidget } from "./definitions/columns";
import { spacerWidget } from "./definitions/spacer";
import { dividerWidget } from "./definitions/divider";
import { pageListWidget } from "./definitions/page-list";
import { formWidget } from "./definitions/form";
import { htmlWidget } from "./definitions/html";
import { heroBannerWidget } from "./definitions/hero-banner";

register(headingWidget);
register(richTextWidget);
register(imageWidget);
register(buttonWidget);
register(sectionWidget);
register(columnsWidget);
register(spacerWidget);
register(dividerWidget);
register(pageListWidget);
register(formWidget);
register(htmlWidget);
register(heroBannerWidget);

// ─── Public API ───────────────────────────────────────────────────────

export function getWidget(type: string): WidgetDefinition | undefined {
  return widgetMap.get(type);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(widgetMap.values());
}

export function isValidWidgetType(type: string): boolean {
  return widgetMap.has(type);
}

export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return Array.from(widgetMap.values()).filter((w) => w.category === category);
}

// ─── Validation ───────────────────────────────────────────────────────

export interface WidgetValidationError {
  field: string;
  message: string;
}

export function validateWidgetProps(
  type: string,
  props: Record<string, unknown>,
  options?: { skipRequired?: boolean }
): WidgetValidationError[] {
  const widget = widgetMap.get(type);
  if (!widget) {
    return [{ field: "_type", message: `Unknown widget type "${type}".` }];
  }

  const errors: WidgetValidationError[] = [];

  for (const def of widget.propSchema) {
    const value = props[def.name];

    if (def.required && !options?.skipRequired) {
      if (value === undefined || value === null || value === "") {
        errors.push({
          field: def.name,
          message: `${def.label} is required.`,
        });
      }
    }

    if (def.type === "number" && value !== undefined && value !== "") {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({ field: def.name, message: `${def.label} must be a number.` });
      } else {
        if (def.min !== undefined && num < def.min) {
          errors.push({ field: def.name, message: `${def.label} must be at least ${def.min}.` });
        }
        if (def.max !== undefined && num > def.max) {
          errors.push({ field: def.name, message: `${def.label} must be at most ${def.max}.` });
        }
      }
    }
  }

  return errors;
}

export function buildDefaultWidgetProps(
  schema: WidgetPropDefinition[]
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const def of schema) {
    props[def.name] = def.defaultValue ?? (def.type === "boolean" ? false : "");
  }
  return props;
}
