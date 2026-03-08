import type { WidgetInstance } from "../types";

export function RichTextRenderer({ widget }: { widget: WidgetInstance }) {
  const { content } = widget.props as { content: string };

  if (!content) return null;

  return (
    <div
      className="prose max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
