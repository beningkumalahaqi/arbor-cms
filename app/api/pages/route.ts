import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidPageType, getPageType } from "@/lib/page-types";
import { validateProperties, buildDefaultContent } from "@/lib/properties";
import { validateSlug } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Validate slug
  if (!slug || !validateSlug(slug)) {
    return NextResponse.json(
      {
        error:
          "Invalid slug. Use lowercase letters, numbers, and hyphens only.",
      },
      { status: 400 }
    );
  }

  // Build fullPath
  let fullPath = `/${slug}`;
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
    fullPath = `${parent.fullPath}/${slug}`;
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
      slug,
      fullPath,
      parentId: parentId || null,
      pageType,
      content: JSON.stringify(mergedContent),
      status: "draft",
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
