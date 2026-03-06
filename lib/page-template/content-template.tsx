import type { PageTemplateProps } from "./types";

export function ContentTemplate({ content, pageType }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <article>
        {content.title && (
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {content.title}
          </h1>
        )}
        {content.description && (
          <div
            className="prose mt-6 max-w-none text-foreground/80 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
        )}
        {!content.title && !content.description && (
          <p className="text-muted-foreground">
            This {pageType} page has no content yet.
          </p>
        )}
      </article>
    </div>
  );
}
