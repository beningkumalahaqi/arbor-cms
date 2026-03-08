import type { WidgetDefinition } from "../types";

export const spacerWidget: WidgetDefinition = {
  type: "spacer",
  label: "Spacer",
  description: "Adds vertical spacing between widgets.",
  icon: "M12 5v14 M5 12h14",
  category: "layout",
  propSchema: [
    {
      name: "size",
      label: "Spacer Size",
      type: "select",
      required: true,
      defaultValue: "md",
      options: [
        { label: "Extra Small (8px)", value: "xs" },
        { label: "Small (16px)", value: "sm" },
        { label: "Medium (32px)", value: "md" },
        { label: "Large (48px)", value: "lg" },
        { label: "Extra Large (64px)", value: "xl" },
        { label: "2XL (96px)", value: "2xl" },
      ],
    },
  ],
};
