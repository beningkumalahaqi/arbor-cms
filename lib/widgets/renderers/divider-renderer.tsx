import type { WidgetInstance } from "../types";

const spacingClasses: Record<string, string> = {
  sm: "my-4",
  md: "my-8",
  lg: "my-12",
};

const styleMap: Record<string, string> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};

export function DividerRenderer({ widget }: { widget: WidgetInstance }) {
  const { style = "solid", color, spacing = "md" } = widget.props as {
    style: string;
    color: string;
    spacing: string;
  };

  const spacingClass = spacingClasses[spacing] || spacingClasses.md;
  const styleClass = styleMap[style] || styleMap.solid;

  return (
    <hr
      className={`border-t ${styleClass} ${spacingClass} ${!color ? "border-border" : ""}`}
      style={color ? { borderColor: color } : undefined}
    />
  );
}
