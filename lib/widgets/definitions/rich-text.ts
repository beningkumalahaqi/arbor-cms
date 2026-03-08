import type { WidgetDefinition } from "../types";

export const richTextWidget: WidgetDefinition = {
  type: "rich-text",
  label: "Rich Text",
  description: "A block of rich text content with full formatting support.",
  icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  category: "content",
  propSchema: [
    {
      name: "content",
      label: "Content",
      type: "richText",
      required: true,
      defaultValue: "",
      placeholder: "Enter rich text content",
    },
  ],
};
