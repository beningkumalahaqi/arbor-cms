import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPageType } from "@/lib/page-types";
import { validateProperties } from "@/lib/properties";
import { validateSlug } from "@/lib/validation";
import { updateDescendantPaths } from "@/lib/pages/utils";

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
    content,
    status,
    showInNav,
    navLabel,
    name,
    slug,
    metaTitle,
    metaDescription,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
  } = body;

  const updateData: Record<string, unknown> = {};

  // Update display name
  if (name !== undefined) {
    updateData.name = String(name);
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
  if (metaTitle !== undefined) updateData.metaTitle = String(metaTitle);
  if (metaDescription !== undefined) updateData.metaDescription = String(metaDescription);
  if (canonicalUrl !== undefined) updateData.canonicalUrl = String(canonicalUrl);
  if (ogTitle !== undefined) updateData.ogTitle = String(ogTitle);
  if (ogDescription !== undefined) updateData.ogDescription = String(ogDescription);
  if (ogImage !== undefined) updateData.ogImage = String(ogImage);

  // Handle slug change — recalculate fullPath and cascade to children
  if (slug !== undefined && slug !== page.slug) {
    // Home page slug cannot be changed
    if (page.pageType === "home") {
      return NextResponse.json(
        { error: "The home page slug cannot be changed." },
        { status: 400 }
      );
    }

    if (!validateSlug(slug)) {
      return NextResponse.json(
        { error: "Invalid slug. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    // Calculate new fullPath
    let newFullPath: string;
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
    const existing = await prisma.page.findUnique({ where: { fullPath: newFullPath } });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "A page with this path already exists." },
        { status: 409 }
      );
    }

    const oldFullPath = page.fullPath;
    updateData.slug = slug;
    updateData.fullPath = newFullPath;

    // First update the page itself, then cascade to descendants
    const updatedPage = await prisma.page.update({
      where: { id },
      data: updateData,
    });

    // Cascade fullPath updates to all descendants
    await updateDescendantPaths(id, oldFullPath, newFullPath);

    return NextResponse.json({ page: updatedPage });
  }

  const updatedPage = await prisma.page.update({
    where: { id },
    data: updateData,
  });

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
