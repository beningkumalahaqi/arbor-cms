import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { updateDescendantPaths } from "@/lib/pages/utils";

/**
 * POST /api/pages/move
 * Body: { id: string, newParentId: string | null, sortOrder?: number }
 *
 * Moves a page under a new parent, recalculating fullPath for itself and all
 * descendants. Optionally updates sortOrder.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, newParentId, sortOrder } = body;

  if (!id) {
    return NextResponse.json({ error: "Page id is required." }, { status: 400 });
  }

  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }

  // Home page cannot be moved
  if (page.pageType === "home") {
    return NextResponse.json(
      { error: "The home page cannot be moved." },
      { status: 400 }
    );
  }

  // Prevent moving a page under itself or its own descendants
  if (newParentId) {
    let cursor = newParentId as string;
    while (cursor) {
      if (cursor === id) {
        return NextResponse.json(
          { error: "Cannot move a page under itself or its own descendant." },
          { status: 400 }
        );
      }
      const ancestor = await prisma.page.findUnique({ where: { id: cursor } });
      cursor = ancestor?.parentId ?? "";
    }
  }

  // Compute new fullPath
  let newFullPath: string;
  if (newParentId) {
    const parent = await prisma.page.findUnique({ where: { id: newParentId } });
    if (!parent) {
      return NextResponse.json({ error: "Parent page not found." }, { status: 400 });
    }
    newFullPath =
      parent.fullPath === "/" ? `/${page.slug}` : `${parent.fullPath}/${page.slug}`;
  } else {
    newFullPath = `/${page.slug}`;
  }

  // Check uniqueness (skip if path unchanged)
  if (newFullPath !== page.fullPath) {
    const existing = await prisma.page.findUnique({ where: { fullPath: newFullPath } });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "A page with this path already exists at the destination." },
        { status: 409 }
      );
    }
  }

  const oldFullPath = page.fullPath;

  const updateData: Record<string, unknown> = {
    parentId: newParentId ?? null,
    fullPath: newFullPath,
  };
  if (sortOrder !== undefined) {
    updateData.sortOrder = sortOrder;
  }

  const updatedPage = await prisma.page.update({
    where: { id },
    data: updateData,
  });

  // Cascade fullPath updates to descendants
  if (newFullPath !== oldFullPath) {
    await updateDescendantPaths(id, oldFullPath, newFullPath);
  }

  return NextResponse.json({ page: updatedPage });
}
