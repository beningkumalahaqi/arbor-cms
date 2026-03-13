import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPageType } from "@/lib/page-types";
import { validateProperties } from "@/lib/properties";
import { validateSlug } from "@/lib/validation";

export async function GET(
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

  return NextResponse.json({ page });
}

/** Recursively update fullPath for all descendants when a page's path changes. */
async function updateDescendantPaths(
  pageId: string,
  oldBasePath: string,
  newBasePath: string
): Promise<void> {
  const children = await prisma.page.findMany({ where: { parentId: pageId } });
  for (const child of children) {
    const oldChildPath = child.fullPath;
    const newChildPath = newBasePath + oldChildPath.slice(oldBasePath.length);
    await prisma.page.update({
      where: { id: child.id },
      data: { fullPath: newChildPath },
    });
    await updateDescendantPaths(child.id, oldChildPath, newChildPath);
  }
}

export async function PUT(
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

  const body = await request.json();
  const {
    name,
    slug,
    content,
    status,
    showInNav,
    navLabel,
    seoTitle,
    seoDescription,
    seoCanonical,
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage,
  } = body;

  const updateData: Record<string, unknown> = {};

  // Update display name
  if (name !== undefined) {
    updateData.name = String(name);
  }

  // Update slug (and cascade fullPath changes to all descendants)
  let oldFullPath: string | null = null;
  let newFullPath: string | null = null;

  if (slug !== undefined && slug !== page.slug) {
    if (page.pageType === "home") {
      return NextResponse.json(
        { error: "Cannot change the slug of the home page." },
        { status: 400 }
      );
    }
    if (!validateSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    // Build new fullPath
    if (page.parentId) {
      const parent = await prisma.page.findUnique({ where: { id: page.parentId } });
      if (!parent) {
        return NextResponse.json({ error: "Parent page not found." }, { status: 400 });
      }
      newFullPath = parent.fullPath === "/" ? `/${slug}` : `${parent.fullPath}/${slug}`;
    } else {
      newFullPath = `/${slug}`;
    }

    // Check uniqueness
    const conflicting = await prisma.page.findUnique({ where: { fullPath: newFullPath } });
    if (conflicting && conflicting.id !== id) {
      return NextResponse.json(
        { error: "A page with this path already exists." },
        { status: 409 }
      );
    }

    oldFullPath = page.fullPath;
    updateData.slug = slug;
    updateData.fullPath = newFullPath;
  }

  // Validate and update content
  if (content) {
    const typeDef = getPageType(page.pageType);
    if (!typeDef) {
      return NextResponse.json(
        { error: "Invalid page type." },
        { status: 400 }
      );
    }

    const validationErrors = validateProperties(
      typeDef.allowedProperties,
      content
    );
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed.", details: validationErrors },
        { status: 400 }
      );
    }

    updateData.content = JSON.stringify(content);
  }

  // Update status
  if (status && (status === "draft" || status === "published")) {
    updateData.status = status;
  }

  // Update navigation fields
  if (showInNav !== undefined) {
    updateData.showInNav = showInNav ? 1 : 0;
  }
  if (navLabel !== undefined) {
    updateData.navLabel = String(navLabel);
  }

  // Update SEO fields
  if (seoTitle !== undefined) updateData.seoTitle = String(seoTitle);
  if (seoDescription !== undefined) updateData.seoDescription = String(seoDescription);
  if (seoCanonical !== undefined) updateData.seoCanonical = String(seoCanonical);
  if (ogTitle !== undefined) updateData.ogTitle = String(ogTitle);
  if (ogDescription !== undefined) updateData.ogDescription = String(ogDescription);
  if (ogUrl !== undefined) updateData.ogUrl = String(ogUrl);
  if (ogImage !== undefined) updateData.ogImage = String(ogImage);

  const updatedPage = await prisma.page.update({
    where: { id },
    data: updateData,
  });

  // Cascade fullPath updates to descendants if slug changed
  if (oldFullPath && newFullPath) {
    await updateDescendantPaths(id, oldFullPath, newFullPath);
  }

  return NextResponse.json({ page: updatedPage });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check for child pages
  const children = await prisma.page.findMany({
    where: { parentId: id },
  });

  if (children.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete a page with children. Remove children first." },
      { status: 400 }
    );
  }

  await prisma.page.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
