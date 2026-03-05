import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPageType, type PageContent } from "@/lib/page-types";

interface CatchAllPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const fullPath = slug ? `/${slug.join("/")}` : "/";

  const page = await prisma.page.findUnique({
    where: { fullPath },
  });

  if (!page || page.status !== "published") {
    notFound();
  }

  const content: PageContent =
    typeof page.content === "string"
      ? JSON.parse(page.content)
      : (page.content as PageContent);

  const typeDef = getPageType(page.pageType);

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
            This {typeDef?.label ?? "page"} has no content yet.
          </p>
        )}
      </article>
    </div>
  );
}
