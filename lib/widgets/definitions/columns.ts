import type { WidgetDefinition } from "../types";

export const columnsWidget: WidgetDefinition = {
  type: "columns",
  label: "Columns",
  description: "A multi-column layout for placing widgets side by side.",
  icon: "M3 3h7v18H3z M14 3h7v18h-7z",
  category: "layout",
  isContainer: true,
  slots: [
    {
      name: "column1",
      label: "Column 1",
    },
    {
      name: "column2",
      label: "Column 2",
    },
    {
      name: "column3",
      label: "Column 3",
    },
  ],
  propSchema: [
    {
      name: "layout",
      label: "Column Layout",
      type: "select",
      required: true,
      defaultValue: "1-1",
      options: [
        { label: "2 Equal (50/50)", value: "1-1" },
        { label: "2 Columns (33/67)", value: "1-2" },
        { label: "2 Columns (67/33)", value: "2-1" },
        { label: "3 Equal (33/33/33)", value: "1-1-1" },
        { label: "3 Columns (25/50/25)", value: "1-2-1" },
      ],
    },
    {
      name: "gap",
      label: "Column Gap",
      type: "select",
      defaultValue: "md",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
  ],
};
