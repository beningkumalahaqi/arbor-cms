import type { WidgetDefinition } from "../types";

export const formWidget: WidgetDefinition = {
  type: "form",
  label: "Form",
  description: "A configurable form with customizable fields and submission handling.",
  icon: "M9 11H3v10h6V11z M21 3h-6v18h6V3z M15 7H9v14h6V7z",
  category: "interactive",
  propSchema: [
    {
      name: "formTypeId",
      label: "Form Type ID",
      type: "text",
      defaultValue: "",
      helpText: "Links this widget to a Form Type. Managed automatically.",
    },
    {
      name: "formName",
      label: "Form Name",
      type: "text",
      required: true,
      defaultValue: "Contact Form",
      placeholder: "e.g., Contact Us Form",
      helpText: "Display name for this form.",
    },
    {
      name: "submitButtonText",
      label: "Submit Button Text",
      type: "text",
      defaultValue: "Submit",
      placeholder: "Submit",
    },
    {
      name: "successMessage",
      label: "Success Message",
      type: "text",
      defaultValue: "Thank you for your submission!",
      placeholder: "Message shown after successful submission",
    },
    {
      name: "elements",
      label: "Form Elements",
      type: "formElements",
      required: true,
      defaultValue: [],
    },
  ],
};
