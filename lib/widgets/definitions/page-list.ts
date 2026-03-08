import type { WidgetDefinition } from "../types";

export const pageListWidget: WidgetDefinition = {
  type: "page-list",
  label: "Page List",
  description: "Displays a list of child pages or pages by type.",
  icon: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  category: "content",
  propSchema: [
    {
      name: "source",
      label: "Page Source",
      type: "select",
      required: true,
      defaultValue: "children",
      options: [
        { label: "Children of Current Page", value: "children" },
        { label: "All Pages by Type", value: "by-type" },
      ],
    },
    {
      name: "pageType",
      label: "Page Type Filter",
      type: "text",
      defaultValue: "",
      helpText: "Only used when source is 'All Pages by Type'. Enter page type name (e.g., article).",
    },
    {
      name: "limit",
      label: "Max Pages",
      type: "number",
      defaultValue: 10,
      min: 1,
      max: 100,
      helpText: "Maximum number of pages to display.",
    },
    {
      name: "displayStyle",
      label: "Display Style",
      type: "select",
      defaultValue: "list",
      options: [
        { label: "Simple List", value: "list" },
        { label: "Card Grid", value: "cards" },
      ],
    },
    {
      name: "showDescription",
      label: "Show Description",
      type: "boolean",
      defaultValue: true,
    },
  ],
};
