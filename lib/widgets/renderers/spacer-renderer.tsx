import type { WidgetInstance } from "../types";

const sizeClasses: Record<string, string> = {
  xs: "h-2",
  sm: "h-4",
  md: "h-8",
  lg: "h-12",
  xl: "h-16",
  "2xl": "h-24",
};

export function SpacerRenderer({ widget }: { widget: WidgetInstance }) {
  const { size = "md" } = widget.props as { size: string };
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return <div className={sizeClass} aria-hidden="true" />;
}
