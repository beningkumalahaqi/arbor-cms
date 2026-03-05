import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { PageContent } from "@/lib/page-types";
import { getTemplate } from "@/lib/page-template";

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

  const template = getTemplate(page.pageType);

  if (!template) {
    notFound();
  }

  return template({
    content,
    pageType: page.pageType,
    fullPath: page.fullPath,
  });
}
