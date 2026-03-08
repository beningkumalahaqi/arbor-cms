import type { WidgetDefinition } from "../types";

export const htmlWidget: WidgetDefinition = {
  type: "html",
  label: "HTML",
  description: "Embed raw HTML content. Use with caution.",
  icon: "M16 18l6-6-6-6 M8 6l-6 6 6 6",
  category: "advanced",
  propSchema: [
    {
      name: "code",
      label: "HTML Code",
      type: "textarea",
      required: true,
      defaultValue: "",
      placeholder: "<div>Your HTML here</div>",
      helpText: "Raw HTML will be rendered directly. Ensure it is safe and well-formed.",
    },
  ],
};
