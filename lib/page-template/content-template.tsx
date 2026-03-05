import type { PageTemplateProps } from "./types";

export function ContentTemplate({ content, pageType }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <article>
        {content.title && (
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {content.title}
          </h1>
        )}
        {content.description && (
          <div className="prose mt-6 max-w-none text-zinc-700 dark:text-zinc-300">
            {content.description.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
        {!content.title && !content.description && (
          <p className="text-zinc-500">
            This {pageType} page has no content yet.
          </p>
        )}
      </article>
    </div>
  );
}
