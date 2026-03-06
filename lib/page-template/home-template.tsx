import type { PageTemplateProps } from "./types";

export function HomeTemplate({ content }: PageTemplateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      {content.title && (
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          {content.title}
        </h1>
      )}
      {content.description && (
        <div
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
      )}
      {!content.title && !content.description && (
        <p className="text-muted-foreground">This home page has no content yet.</p>
      )}
    </div>
  );
}
