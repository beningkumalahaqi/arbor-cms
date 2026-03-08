import { PageTypeDefinition } from "./types";

export const contentPageType: PageTypeDefinition = {
  name: "content",
  label: "Content",
  description: "A generic content page. Can exist anywhere in the tree.",
  allowedProperties: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: false,
      defaultValue: "",
    },
    {
      name: "description",
      label: "Description",
      type: "richText",
      required: false,
      defaultValue: "",
    },
  ],
};
