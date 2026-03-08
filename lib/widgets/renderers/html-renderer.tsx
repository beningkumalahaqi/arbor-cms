import type { WidgetInstance } from "../types";

export function HtmlRenderer({ widget }: { widget: WidgetInstance }) {
  const { code } = widget.props as { code: string };

  if (!code) return null;

  return <div dangerouslySetInnerHTML={{ __html: code }} />;
}
