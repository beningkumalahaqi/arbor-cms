import type { WidgetDefinition } from "../types";

export const heroBannerWidget: WidgetDefinition = {
  type: "hero-banner",
  label: "Hero Banner",
  description: "A full-width hero banner with background image, title, subtitle, and call-to-action.",
  icon: "M3 3h18v12H3z M8 21h8 M12 15v6",
  category: "media",
  propSchema: [
    {
      name: "backgroundImage",
      label: "Background Image",
      type: "image",
      defaultValue: "",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      defaultValue: "Hero Title",
      placeholder: "Enter hero title",
    },
    {
      name: "subtitle",
      label: "Subtitle",
      type: "text",
      defaultValue: "",
      placeholder: "Optional subtitle",
    },
    {
      name: "ctaText",
      label: "Button Text",
      type: "text",
      defaultValue: "",
      placeholder: "Get Started",
      helpText: "Leave empty to hide the button.",
    },
    {
      name: "ctaUrl",
      label: "Button URL",
      type: "url",
      defaultValue: "",
      placeholder: "https://example.com or /page-path",
    },
    {
      name: "height",
      label: "Banner Height",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "Small (300px)", value: "sm" },
        { label: "Medium (450px)", value: "md" },
        { label: "Large (600px)", value: "lg" },
        { label: "Full Screen", value: "full" },
      ],
    },
    {
      name: "overlay",
      label: "Dark Overlay",
      type: "boolean",
      defaultValue: true,
      helpText: "Adds a dark overlay to improve text readability.",
    },
    {
      name: "alignment",
      label: "Text Alignment",
      type: "select",
      defaultValue: "center",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
    },
  ],
};
