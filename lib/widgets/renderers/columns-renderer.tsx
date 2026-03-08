import type { WidgetInstance } from "../types";

const layoutGridClasses: Record<string, string> = {
  "1-1": "grid-cols-1 md:grid-cols-2",
  "1-2": "grid-cols-1 md:grid-cols-3",
  "2-1": "grid-cols-1 md:grid-cols-3",
  "1-1-1": "grid-cols-1 md:grid-cols-3",
  "1-2-1": "grid-cols-1 md:grid-cols-4",
};

const layoutColSpans: Record<string, string[]> = {
  "1-1": ["md:col-span-1", "md:col-span-1"],
  "1-2": ["md:col-span-1", "md:col-span-2"],
  "2-1": ["md:col-span-2", "md:col-span-1"],
  "1-1-1": ["md:col-span-1", "md:col-span-1", "md:col-span-1"],
  "1-2-1": ["md:col-span-1", "md:col-span-2", "md:col-span-1"],
};

const gapClasses: Record<string, string> = {
  none: "gap-0",
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
};

interface ColumnsRendererProps {
  widget: WidgetInstance;
  pageId: string;
  fullPath: string;
  allWidgets?: WidgetInstance[];
  renderWidget?: (widget: WidgetInstance) => React.ReactNode;
}

export function ColumnsRenderer({ widget, allWidgets = [], renderWidget }: ColumnsRendererProps) {
  const {
    layout = "1-1",
    gap = "md",
  } = widget.props as {
    layout: string;
    gap: string;
  };

  const gridClass = layoutGridClasses[layout] || layoutGridClasses["1-1"];
  const colSpans = layoutColSpans[layout] || layoutColSpans["1-1"];
  const gapClass = gapClasses[gap] || gapClasses.md;
  const isThreeCol = layout.split("-").length === 3;

  const slotNames = isThreeCol
    ? ["column1", "column2", "column3"]
    : ["column1", "column2"];

  return (
    <div className={`grid ${gridClass} ${gapClass}`}>
      {slotNames.map((slotName, i) => {
        const childWidgets = allWidgets
          .filter((w) => w.parentId === widget.id && w.slot === slotName)
          .sort((a, b) => a.sortOrder - b.sortOrder);

        return (
          <div key={slotName} className={colSpans[i] || ""}>
            {childWidgets.length > 0 && renderWidget ? (
              <div className="space-y-4">
                {childWidgets.map((child) => (
                  <div key={child.id}>{renderWidget(child)}</div>
                ))}
              </div>
            ) : childWidgets.length > 0 ? (
              <div className="space-y-4">
                {childWidgets.map((child) => (
                  <div key={child.id} className="rounded-md border p-2 text-xs text-muted-foreground">
                    {child.type}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Empty column
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
