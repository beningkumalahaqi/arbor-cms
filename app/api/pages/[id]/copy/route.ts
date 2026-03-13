import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensurePageFolder } from "@/lib/storage";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });

  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // Home page cannot be copied (singleton)
  if (page.pageType === "home") {
    return NextResponse.json(
      { error: "The home page cannot be copied." },
      { status: 400 }
    );
  }

  // Fetch the parent once (reused for both uniqueness check and fullPath construction)
  const parent = page.parentId
    ? await prisma.page.findUnique({ where: { id: page.parentId } })
    : null;
  const parentBase = parent ? (parent.fullPath === "/" ? "" : parent.fullPath) : "";

  // Find a unique slug by appending -copy, -copy-2, etc.
  let newSlug = `${page.slug}-copy`;
  let suffix = 1;
  while (true) {
    const candidate = suffix === 1 ? newSlug : `${page.slug}-copy-${suffix}`;
    const candidatePath = `${parentBase}/${candidate}`;
    const existing = await prisma.page.findUnique({
      where: { fullPath: candidatePath },
    });
    if (!existing) {
      newSlug = candidate;
      break;
    }
    suffix++;
    if (suffix > 100) {
      return NextResponse.json(
        { error: "Could not find a unique slug for the copied page." },
        { status: 409 }
      );
    }
  }

  const newFullPath = `${parentBase}/${newSlug}`;

  const copied = await prisma.page.create({
    data: {
      slug: newSlug,
      fullPath: newFullPath,
      name: page.name ? `${page.name} (Copy)` : "",
      parentId: page.parentId,
      pageType: page.pageType,
      status: "draft",
      content: page.content,
      sortOrder: page.sortOrder,
      showInNav: 0,
      navLabel: "",
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      canonicalUrl: "",
      ogTitle: page.ogTitle,
      ogDescription: page.ogDescription,
      ogImage: page.ogImage,
    },
  });

  // Auto-create storage folder for the copied page
  try {
    await ensurePageFolder(newFullPath);
  } catch {
    // Non-critical
  }

  return NextResponse.json({ page: copied }, { status: 201 });
}
