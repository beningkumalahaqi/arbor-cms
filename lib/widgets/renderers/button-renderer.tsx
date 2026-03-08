import type { WidgetInstance } from "../types";

const variantClasses: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
  ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
};

const alignmentClasses: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function ButtonRenderer({ widget }: { widget: WidgetInstance }) {
  const { text, url, variant = "primary", alignment = "left", openInNewTab = false } = widget.props as {
    text: string;
    url: string;
    variant: string;
    alignment: string;
    openInNewTab: boolean;
  };

  if (!text) return null;

  return (
    <div className={alignmentClasses[alignment] || ""}>
      <a
        href={url || "#"}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={`inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors ${variantClasses[variant] || variantClasses.primary}`}
      >
        {text}
      </a>
    </div>
  );
}
