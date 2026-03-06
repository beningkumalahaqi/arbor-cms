import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { PageContent } from "@/lib/page-types";
import { getTemplate } from "@/lib/page-template";
import { SiteLayout } from "@/components/site/site-layout";

export const dynamic = "force-dynamic";

interface CatchAllPageProps {
  params: Promise<{ slug?: string[] }>;
}

function toTitleCase(slug: string): string {
  if (!slug) return "Home";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const fullPath = slug ? `/${slug.join("/")}` : "/";

  // Fetch page and site layout data in parallel
  const [page, siteSettings, navPages] = await Promise.all([
    prisma.page.findUnique({ where: { fullPath } }),
    prisma.siteSettings.findFirst(),
    prisma.page.findMany({
      where: { showInNav: 1, status: "published", parentId: null },
      select: { id: true, slug: true, fullPath: true, navLabel: true, sortOrder: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

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

  const navigationEnabled = siteSettings ? siteSettings.navigationEnabled === 1 : true;
  const footerEnabled = siteSettings ? siteSettings.footerEnabled === 1 : true;

  const navigation = {
    enabled: navigationEnabled,
    logo: siteSettings?.navigationLogo ?? "",
    title: siteSettings?.navigationTitle ?? "Arbor CMS",
    items: navPages.map((p) => ({
      id: p.id,
      label: p.navLabel || toTitleCase(p.slug),
      path: p.fullPath,
    })),
  };

  const footer = {
    enabled: footerEnabled,
    logo: siteSettings?.footerLogo ?? "",
    text: siteSettings?.footerText ?? "",
  };

  return (
    <SiteLayout navigation={navigation} footer={footer} currentPath={fullPath}>
      {template({
        content,
        pageType: page.pageType,
        fullPath: page.fullPath,
      })}
    </SiteLayout>
  );
}
