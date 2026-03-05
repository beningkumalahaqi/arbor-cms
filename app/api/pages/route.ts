import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidPageType, getPageType } from "@/lib/page-types";
import { validateProperties, buildDefaultContent } from "@/lib/properties";
import { validateSlug } from "@/lib/validation";
import { ensurePageFolder } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tree = searchParams.get("tree") === "true";

  if (tree) {
    // Return pages with children included for tree view
    const pages = await prisma.page.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { children: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
    });
    const settings = await prisma.pageTypeSettings.findMany();
    return NextResponse.json({ pages, settings });
  }

  const pages = await prisma.page.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ pages });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, parentId, pageType, content } = body;

  // Validate page type
  if (!pageType || !isValidPageType(pageType)) {
    return NextResponse.json(
      { error: "Invalid or missing page type." },
      { status: 400 }
    );
  }

  // Home page type: enforce singleton, fixed root path, no parent
  if (pageType === "home") {
    const existingHome = await prisma.page.findFirst({
      where: { pageType: "home" },
    });
    if (existingHome) {
      return NextResponse.json(
        { error: "A home page already exists. Only one home page is allowed." },
        { status: 409 }
      );
    }
    if (parentId) {
      return NextResponse.json(
        { error: "Home page must be a root page and cannot have a parent." },
        { status: 400 }
      );
    }
  }

  // Validate slug (not required for home type)
  if (pageType !== "home" && (!slug || !validateSlug(slug))) {
    return NextResponse.json(
      {
        error:
          "Invalid slug. Use lowercase letters, numbers, and hyphens only.",
      },
      { status: 400 }
    );
  }

  // Build fullPath — home always serves /
  let fullPath: string;
  if (pageType === "home") {
    fullPath = "/";
  } else {
    fullPath = `/${slug}`;
    if (parentId) {
      const parent = await prisma.page.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent page not found." },
          { status: 400 }
        );
      }

      // Enforce allowed children
      const parentSettings = await prisma.pageTypeSettings.findUnique({
        where: { pageTypeName: parent.pageType },
      });
      if (parentSettings) {
        const allowed: string[] = JSON.parse(parentSettings.allowedChildren);
        if (allowed.length > 0 && !allowed.includes(pageType)) {
          return NextResponse.json(
            {
              error: `Page type "${pageType}" is not allowed under a "${parent.pageType}" page.`,
            },
            { status: 400 }
          );
        }
      }

      fullPath =
        parent.fullPath === "/" ? `/${slug}` : `${parent.fullPath}/${slug}`;
    }
  }

  // Check uniqueness
  const existing = await prisma.page.findUnique({
    where: { fullPath },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A page with this path already exists." },
      { status: 409 }
    );
  }

  // Build and validate content
  const typeDef = getPageType(pageType)!;
  const mergedContent = {
    ...buildDefaultContent(typeDef.allowedProperties),
    ...content,
  };

  const validationErrors = validateProperties(
    typeDef.allowedProperties,
    mergedContent
  );
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed.", details: validationErrors },
      { status: 400 }
    );
  }

  const page = await prisma.page.create({
    data: {
      slug: pageType === "home" ? "" : slug,
      fullPath,
      parentId: pageType === "home" ? null : parentId || null,
      pageType,
      content: JSON.stringify(mergedContent),
      status: "draft",
    },
  });

  // Auto-create a corresponding folder in storage
  try {
    await ensurePageFolder(fullPath);
  } catch {
    // Non-critical: don't fail page creation if folder creation fails
  }

  return NextResponse.json({ page }, { status: 201 });
}
