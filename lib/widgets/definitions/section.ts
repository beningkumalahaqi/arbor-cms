import type { WidgetDefinition } from "../types";

export const sectionWidget: WidgetDefinition = {
  type: "section",
  label: "Section",
  description: "A wrapper section that contains other widgets with optional background and padding.",
  icon: "M3 3h18v18H3z M3 9h18 M3 15h18",
  category: "layout",
  isContainer: true,
  slots: [
    {
      name: "content",
      label: "Section Content",
    },
  ],
  propSchema: [
    {
      name: "backgroundColor",
      label: "Background Color",
      type: "color",
      defaultValue: "",
      helpText: "Leave empty for transparent background.",
    },
    {
      name: "paddingY",
      label: "Vertical Padding",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
      ],
    },
    {
      name: "paddingX",
      label: "Horizontal Padding",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
        { label: "Extra Large", value: "xl" },
      ],
    },
    {
      name: "maxWidth",
      label: "Max Width",
      type: "select",
      defaultValue: "7xl",
      options: [
        { label: "Small (640px)", value: "sm" },
        { label: "Medium (768px)", value: "md" },
        { label: "Large (1024px)", value: "lg" },
        { label: "XL (1280px)", value: "xl" },
        { label: "2XL (1536px)", value: "2xl" },
        { label: "7XL (1280px wide)", value: "7xl" },
        { label: "Full Width", value: "full" },
      ],
    },
  ],
};
