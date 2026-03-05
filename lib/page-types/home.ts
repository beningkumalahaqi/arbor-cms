import { PageTypeDefinition } from "./types";

export const homePageType: PageTypeDefinition = {
  name: "home",
  label: "Home",
  description: "The home page. Serves the root path /.",
  allowedProperties: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      defaultValue: "Welcome",
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
