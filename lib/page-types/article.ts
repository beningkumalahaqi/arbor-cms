import { PageTypeDefinition } from "./types";

export const articlePageType: PageTypeDefinition = {
  name: "article",
  label: "Article",
  description: "An article page with title, image banner, and rich text content.",
  allowedProperties: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      defaultValue: "",
    },
    {
      name: "imageBanner",
      label: "Image Banner",
      type: "image",
      required: false,
      defaultValue: "",
    },
    {
      name: "content",
      label: "Content",
      type: "richText",
      required: false,
      defaultValue: "",
    },
  ],
};
