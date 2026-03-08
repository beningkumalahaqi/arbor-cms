import type { WidgetDefinition } from "../types";

export const dividerWidget: WidgetDefinition = {
  type: "divider",
  label: "Divider",
  description: "A horizontal line divider to separate content.",
  icon: "M3 12h18",
  category: "layout",
  propSchema: [
    {
      name: "style",
      label: "Style",
      type: "select",
      defaultValue: "solid",
      options: [
        { label: "Solid", value: "solid" },
        { label: "Dashed", value: "dashed" },
        { label: "Dotted", value: "dotted" },
      ],
    },
    {
      name: "color",
      label: "Color",
      type: "color",
      defaultValue: "",
      helpText: "Leave empty for default border color.",
    },
    {
      name: "spacing",
      label: "Vertical Spacing",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  ],
};
