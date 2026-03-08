// ─── Widget Property System ───────────────────────────────────────────
// Each widget declares its configurable properties via WidgetPropDefinition[].
// This is the widget equivalent of PageType's PropertyDefinition[].
// To add a new prop type: extend WidgetPropType, update the admin editor
// form renderer, and update validation if needed.

export type WidgetPropType =
  | "text"
  | "textarea"
  | "richText"
  | "number"
  | "select"
  | "image"
  | "color"
  | "boolean"
  | "url"
  | "formElements";

export interface SelectOption {
  label: string;
  value: string;
}

export interface WidgetPropDefinition {
  name: string;
  label: string;
  type: WidgetPropType;
  required?: boolean;
  defaultValue?: unknown;
  options?: SelectOption[]; // for "select" type
  placeholder?: string;
  helpText?: string;
  min?: number; // for "number" type
  max?: number; // for "number" type
}

// ─── Widget Definition ────────────────────────────────────────────────
// Every widget must export a WidgetDefinition. This is registered in the
// widget registry. Adding a new widget = create definition + register it.

export interface WidgetSlotDefinition {
  name: string; // unique slot identifier within the widget, e.g. "content", "column1"
  label: string; // display name, e.g. "Content", "Column 1"
  allowedWidgets?: string[]; // widget types allowed in this slot; empty = all (except containers)
  maxWidgets?: number; // max child widget count; undefined = unlimited
}

export interface WidgetDefinition {
  type: string; // unique identifier, e.g. "heading", "image", "hero-banner"
  label: string; // display name, e.g. "Heading", "Image", "Hero Banner"
  description: string;
  icon: string; // SVG path data (same format as lib/icons.ts)
  category: WidgetCategory;
  propSchema: WidgetPropDefinition[];
  isContainer?: boolean; // true if this widget wraps other widgets (e.g. section, columns)
  slots?: WidgetSlotDefinition[]; // child widget slots (required if isContainer is true)
}

export type WidgetCategory =
  | "content"
  | "media"
  | "layout"
  | "interactive"
  | "advanced";

// ─── Widget Instance ──────────────────────────────────────────────────
// Stored per page per area in the database.

export interface WidgetInstance {
  id: string;
  pageId: string;
  area: string;
  type: string;
  props: Record<string, unknown>;
  sortOrder: number;
  parentId: string | null;
  slot: string;
}

// ─── Widget Area Configuration ────────────────────────────────────────
// Defined in template code to declare where widgets can be placed.

export interface WidgetAreaDefinition {
  name: string; // unique area identifier within a template, e.g. "main", "sidebar"
  label: string; // display name, e.g. "Main Content", "Sidebar"
  allowedWidgets?: string[]; // widget types allowed; empty/undefined = all allowed
  maxWidgets?: number; // max widget count; undefined = unlimited
}

// ─── Form Element Types ──────────────────────────────────────────────
// Used by the Form widget to define configurable form fields.

export type FormElementType =
  | "text-input"
  | "email-input"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "submit";

export interface FormElementDefinition {
  id: string;
  type: FormElementType;
  label: string;
  name: string; // field name for submission
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[]; // for select, radio, checkbox
  defaultValue?: string;
  buttonText?: string; // for submit type
}
