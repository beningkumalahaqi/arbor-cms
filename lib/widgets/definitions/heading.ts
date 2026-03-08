import type { WidgetDefinition } from "../types";

export const headingWidget: WidgetDefinition = {
  type: "heading",
  label: "Heading",
  description: "A text heading with configurable level and alignment.",
  icon: "M4 12h8 M4 18V6 M12 18V6 M17 12l3-6 3 6 M17.7 14h4.6",
  category: "content",
  propSchema: [
    {
      name: "text",
      label: "Heading Text",
      type: "text",
      required: true,
      defaultValue: "Heading",
      placeholder: "Enter heading text",
    },
    {
      name: "level",
      label: "Heading Level",
      type: "select",
      required: true,
      defaultValue: "h2",
      options: [
        { label: "H1", value: "h1" },
        { label: "H2", value: "h2" },
        { label: "H3", value: "h3" },
        { label: "H4", value: "h4" },
        { label: "H5", value: "h5" },
        { label: "H6", value: "h6" },
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
  ],
};
