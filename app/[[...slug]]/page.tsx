import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import type { PageContent } from "@/lib/page-types";
import { getTemplate } from "@/lib/page-template";
import { SiteLayout } from "@/components/site/site-layout";
import type { WidgetInstance } from "@/lib/widgets/types";

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

export async function generateMetadata({ params }: CatchAllPageProps): Promise<Metadata> {
  const { slug } = await params;
  const fullPath = slug ? `/${slug.join("/")}` : "/";

  const page = await prisma.page.findUnique({ where: { fullPath } });

  if (!page || page.status !== "published") {
    return {};
  }

  const content: PageContent =
    typeof page.content === "string"
      ? JSON.parse(page.content)
      : (page.content as PageContent);

  const pageTitle = (content.title as string) || toTitleCase(page.slug);
  const title = page.metaTitle || pageTitle;
  const description = page.metaDescription || (content.description as string) || undefined;
  const canonical = page.canonicalUrl || undefined;

  const ogTitleValue = page.ogTitle || title;
  const ogDescValue = page.ogDescription || description;

  const metadata: Metadata = {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: ogTitleValue,
      description: ogDescValue,
      url: canonical || fullPath,
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
  };

  return metadata;
}

export default async function CatchAllPage({ params }: CatchAllPageProps) {
  const { slug } = await params;
  const fullPath = slug ? `/${slug.join("/")}` : "/";

  // Fetch page, widgets, and site layout data in parallel
  const [page, siteSettings, navPages] = await Promise.all([
    prisma.page.findUnique({
      where: { fullPath },
      include: { widgets: { orderBy: [{ area: "asc" }, { sortOrder: "asc" }] } },
    }),
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

  // Parse widgets
  const widgets: WidgetInstance[] = (page.widgets || []).map((w) => ({
    id: w.id,
    pageId: w.pageId,
    area: w.area,
    type: w.type,
    props: JSON.parse(w.props),
    sortOrder: w.sortOrder,
    parentId: w.parentId,
    slot: w.slot,
  }));

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
        pageId: page.id,
        widgets,
      })}
    </SiteLayout>
  );
}
