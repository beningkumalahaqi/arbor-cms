import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPageType } from "@/lib/page-types";
import { validateProperties } from "@/lib/properties";

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
  const { content, status } = body;

  const updateData: Record<string, unknown> = {};

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
