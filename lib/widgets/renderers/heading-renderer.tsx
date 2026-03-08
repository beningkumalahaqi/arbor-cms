import type { WidgetInstance } from "../types";

const levelClasses: Record<string, string> = {
  h1: "text-4xl sm:text-5xl font-bold tracking-tight",
  h2: "text-3xl sm:text-4xl font-bold tracking-tight",
  h3: "text-2xl sm:text-3xl font-semibold",
  h4: "text-xl sm:text-2xl font-semibold",
  h5: "text-lg sm:text-xl font-medium",
  h6: "text-base sm:text-lg font-medium",
};

const alignmentClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function HeadingRenderer({ widget }: { widget: WidgetInstance }) {
  const { text, level = "h2", alignment = "left" } = widget.props as {
    text: string;
    level: string;
    alignment: string;
  };

  const Tag = (["h1","h2","h3","h4","h5","h6"].includes(level) ? level : "h2") as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  const classes = `text-foreground ${levelClasses[level] || levelClasses.h2} ${alignmentClasses[alignment] || ""}`;

  return <Tag className={classes}>{text}</Tag>;
}
