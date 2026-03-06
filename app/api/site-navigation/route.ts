import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Get site settings
  const settings = await prisma.siteSettings.findFirst();

  const navigationEnabled = settings ? settings.navigationEnabled === 1 : true;
  const footerEnabled = settings ? settings.footerEnabled === 1 : true;

  // Get top-level published pages with showInNav enabled
  const navPages = navigationEnabled
    ? await prisma.page.findMany({
        where: {
          showInNav: 1,
          status: "published",
          parentId: null,
        },
        select: {
          id: true,
          slug: true,
          fullPath: true,
          navLabel: true,
          sortOrder: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
    : [];

  return NextResponse.json({
    navigation: {
      enabled: navigationEnabled,
      logo: settings?.navigationLogo ?? "",
      title: settings?.navigationTitle ?? "Arbor CMS",
      items: navPages.map((p) => ({
        id: p.id,
        label: p.navLabel || toTitleCase(p.slug),
        path: p.fullPath,
      })),
    },
    footer: {
      enabled: footerEnabled,
      logo: settings?.footerLogo ?? "",
      text: settings?.footerText ?? "",
    },
  });
}

function toTitleCase(slug: string): string {
  if (!slug) return "Home";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
