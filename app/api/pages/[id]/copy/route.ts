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
  const original = await prisma.page.findUnique({ where: { id } });

  if (!original) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  if (original.pageType === "home") {
    return NextResponse.json(
      { error: "Cannot copy the home page." },
      { status: 400 }
    );
  }

  // Generate a unique slug/fullPath for the copy
  const baseSlug = `${original.slug}-copy`;
  let candidateSlug = baseSlug;
  let suffix = 1;

  // Determine base path prefix from parent
  let pathPrefix = "";
  if (original.parentId) {
    const parent = await prisma.page.findUnique({ where: { id: original.parentId } });
    pathPrefix = parent ? (parent.fullPath === "/" ? "" : parent.fullPath) : "";
  }

  while (true) {
    const candidatePath = `${pathPrefix}/${candidateSlug}`;
    const existing = await prisma.page.findUnique({ where: { fullPath: candidatePath } });
    if (!existing) break;
    suffix += 1;
    candidateSlug = `${baseSlug}-${suffix}`;
  }

  const newFullPath = `${pathPrefix}/${candidateSlug}`;

  const copied = await prisma.page.create({
    data: {
      parentId: original.parentId,
      name: original.name ? `${original.name} (Copy)` : "",
      slug: candidateSlug,
      fullPath: newFullPath,
      pageType: original.pageType,
      status: "draft",
      content: original.content,
      sortOrder: original.sortOrder + 1,
      showInNav: 0,
      navLabel: "",
      seoTitle: original.seoTitle,
      seoDescription: original.seoDescription,
      seoCanonical: "",
      ogTitle: original.ogTitle,
      ogDescription: original.ogDescription,
      ogUrl: "",
      ogImage: original.ogImage,
    },
  });

  try {
    await ensurePageFolder(newFullPath);
  } catch {
    // Non-critical
  }

  return NextResponse.json({ page: copied }, { status: 201 });
}
