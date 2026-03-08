import type { WidgetDefinition } from "../types";

export const imageWidget: WidgetDefinition = {
  type: "image",
  label: "Image",
  description: "An image with optional caption and link.",
  icon: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21",
  category: "media",
  propSchema: [
    {
      name: "src",
      label: "Image",
      type: "image",
      required: true,
      defaultValue: "",
    },
    {
      name: "alt",
      label: "Alt Text",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "Describe the image",
      helpText: "Important for accessibility and SEO.",
    },
    {
      name: "caption",
      label: "Caption",
      type: "text",
      required: false,
      defaultValue: "",
      placeholder: "Optional image caption",
    },
    {
      name: "link",
      label: "Link URL",
      type: "url",
      required: false,
      defaultValue: "",
      placeholder: "https://example.com",
    },
    {
      name: "rounded",
      label: "Rounded Corners",
      type: "boolean",
      defaultValue: true,
    },
  ],
};
