import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

/** Recursively update fullPath for all descendants. */
async function updateDescendantPaths(
  pageId: string,
  oldBasePath: string,
  newBasePath: string
): Promise<void> {
  const children = await prisma.page.findMany({ where: { parentId: pageId } });
  for (const child of children) {
    const newChildPath = newBasePath + child.fullPath.slice(oldBasePath.length);
    await prisma.page.update({
      where: { id: child.id },
      data: { fullPath: newChildPath },
    });
    await updateDescendantPaths(child.id, child.fullPath, newChildPath);
  }
}

export async function POST(
  request: NextRequest,
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

  if (page.pageType === "home") {
    return NextResponse.json(
      { error: "Cannot move the home page." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { newParentId } = body;

  // Prevent moving to its own descendant (would create a cycle)
  if (newParentId) {
    let cursor = await prisma.page.findUnique({ where: { id: newParentId } });
    while (cursor) {
      if (cursor.id === id) {
        return NextResponse.json(
          { error: "Cannot move a page into one of its own descendants." },
          { status: 400 }
        );
      }
      cursor = cursor.parentId
        ? await prisma.page.findUnique({ where: { id: cursor.parentId } })
        : null;
    }
  }

  // Determine new fullPath
  let newParentPath = "";
  if (newParentId) {
    const newParent = await prisma.page.findUnique({ where: { id: newParentId } });
    if (!newParent) {
      return NextResponse.json({ error: "Target parent page not found." }, { status: 400 });
    }

    // Check allowed children for the new parent
    const parentSettings = await prisma.pageTypeSettings.findUnique({
      where: { pageTypeName: newParent.pageType },
    });
    if (parentSettings) {
      const allowed: string[] = JSON.parse(parentSettings.allowedChildren);
      if (allowed.length > 0 && !allowed.includes(page.pageType)) {
        return NextResponse.json(
          {
            error: `Page type "${page.pageType}" is not allowed under a "${newParent.pageType}" page.`,
          },
          { status: 400 }
        );
      }
    }

    newParentPath = newParent.fullPath === "/" ? "" : newParent.fullPath;
  }

  const newFullPath = `${newParentPath}/${page.slug}`;

  // Check uniqueness
  const conflicting = await prisma.page.findUnique({ where: { fullPath: newFullPath } });
  if (conflicting && conflicting.id !== id) {
    return NextResponse.json(
      { error: "A page with this path already exists at the target location." },
      { status: 409 }
    );
  }

  const oldFullPath = page.fullPath;

  const updatedPage = await prisma.page.update({
    where: { id },
    data: {
      parentId: newParentId ?? null,
      fullPath: newFullPath,
    },
  });

  // Cascade update all descendants
  await updateDescendantPaths(id, oldFullPath, newFullPath);

  return NextResponse.json({ page: updatedPage });
}
