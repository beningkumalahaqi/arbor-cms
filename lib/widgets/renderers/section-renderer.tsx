import type { WidgetInstance } from "../types";

const paddingYClasses: Record<string, string> = {
  none: "py-0",
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
  xl: "py-16",
};

const paddingXClasses: Record<string, string> = {
  none: "px-0",
  sm: "px-4",
  md: "px-6",
  lg: "px-8",
  xl: "px-12",
};

const maxWidthClasses: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

// Import WidgetItem lazily to avoid circular imports — we use a render prop pattern instead
interface SectionRendererProps {
  widget: WidgetInstance;
  pageId: string;
  fullPath: string;
  allWidgets?: WidgetInstance[];
  renderWidget?: (widget: WidgetInstance) => React.ReactNode;
}

export function SectionRenderer({ widget, allWidgets = [], renderWidget }: SectionRendererProps) {
  const {
    backgroundColor,
    paddingY = "md",
    paddingX = "md",
    maxWidth = "7xl",
  } = widget.props as {
    backgroundColor: string;
    paddingY: string;
    paddingX: string;
    maxWidth: string;
  };

  const pyClass = paddingYClasses[paddingY] || paddingYClasses.md;
  const pxClass = paddingXClasses[paddingX] || paddingXClasses.md;
  const mwClass = maxWidthClasses[maxWidth] || maxWidthClasses["7xl"];

  // Get child widgets in the "content" slot
  const childWidgets = allWidgets
    .filter((w) => w.parentId === widget.id && w.slot === "content")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section
      className={`${pyClass} ${pxClass}`}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className={`mx-auto ${mwClass}`}>
        {childWidgets.length > 0 && renderWidget ? (
          <div className="space-y-6">
            {childWidgets.map((child) => (
              <div key={child.id}>{renderWidget(child)}</div>
            ))}
          </div>
        ) : childWidgets.length > 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Section has child widgets but no renderer available.
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            Empty section — add widgets to this section in the editor.
          </div>
        )}
      </div>
    </section>
  );
}
