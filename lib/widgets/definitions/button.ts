import type { WidgetDefinition } from "../types";

export const buttonWidget: WidgetDefinition = {
  type: "button",
  label: "Button",
  description: "A call-to-action button with configurable text, link, and style.",
  icon: "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z M8 12h8",
  category: "interactive",
  propSchema: [
    {
      name: "text",
      label: "Button Text",
      type: "text",
      required: true,
      defaultValue: "Click Me",
      placeholder: "Button label",
    },
    {
      name: "url",
      label: "Link URL",
      type: "url",
      required: true,
      defaultValue: "#",
      placeholder: "https://example.com or /page-path",
    },
    {
      name: "variant",
      label: "Style",
      type: "select",
      defaultValue: "primary",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
        { label: "Outline", value: "outline" },
        { label: "Ghost", value: "ghost" },
      ],
    },
    {
      name: "alignment",
      label: "Alignment",
      type: "select",
      defaultValue: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
    {
      name: "openInNewTab",
      label: "Open in New Tab",
      type: "boolean",
      defaultValue: false,
    },
  ],
};
