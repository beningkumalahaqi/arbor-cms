import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/widgets/page-list — Fetch pages for the PageList widget
// Public endpoint (no auth required) — used by the frontend renderer
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "children";
  const pageType = searchParams.get("pageType") || "";
  const limit = Math.min(Number(searchParams.get("limit") || 10), 100);
  const fullPath = searchParams.get("fullPath") || "/";

  let pages;

  if (source === "children") {
    // Find the current page, then get its children
    const currentPage = await prisma.page.findUnique({
      where: { fullPath },
      select: { id: true },
    });

    if (!currentPage) {
      return NextResponse.json({ pages: [] });
    }

    pages = await prisma.page.findMany({
      where: { parentId: currentPage.id, status: "published" },
      select: {
        id: true,
        slug: true,
        fullPath: true,
        pageType: true,
        content: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
  } else {
    // Get pages by type
    const where: Record<string, unknown> = { status: "published" };
    if (pageType) {
      where.pageType = pageType;
    }

    pages = await prisma.page.findMany({
      where,
      select: {
        id: true,
        slug: true,
        fullPath: true,
        pageType: true,
        content: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
  }

  return NextResponse.json({ pages });
}
