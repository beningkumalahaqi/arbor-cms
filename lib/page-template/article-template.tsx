import type { PageTemplateProps } from "./types";

export function ArticleTemplate({ content }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <article>
        {/* Title */}
        {content.title && (
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-100">
            {content.title}
          </h1>
        )}

        {/* Image Banner */}
        {content.imageBanner && (
          <div className="mt-8 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/storage/file/${content.imageBanner}`}
              alt={content.title || "Article banner"}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        {content.content && (
          <div
            className="prose prose-lg prose-zinc mt-10 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-lg dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}

        {!content.title && !content.imageBanner && !content.content && (
          <p className="text-zinc-500">This article has no content yet.</p>
        )}
      </article>
    </div>
  );
}
