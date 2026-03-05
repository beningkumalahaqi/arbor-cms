import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isValidPageType, getAllPageTypes } from "@/lib/page-types";
import { availableIcons } from "@/lib/icons";

// GET all page type settings
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.pageTypeSettings.findMany();
  return NextResponse.json({ settings });
}

// PUT update a single page type's settings
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { pageTypeName, icon, allowedChildren } = body;

  if (!pageTypeName || !isValidPageType(pageTypeName)) {
    return NextResponse.json(
      { error: "Invalid or missing page type name." },
      { status: 400 }
    );
  }

  // Validate icon name
  if (icon && !availableIcons.some((i) => i.name === icon)) {
    return NextResponse.json(
      { error: "Invalid icon name." },
      { status: 400 }
    );
  }

  // Validate allowedChildren — must be an array of valid page type names
  if (allowedChildren !== undefined) {
    if (!Array.isArray(allowedChildren)) {
      return NextResponse.json(
        { error: "allowedChildren must be an array." },
        { status: 400 }
      );
    }
    const allTypes = getAllPageTypes().map((pt) => pt.name);
    for (const child of allowedChildren) {
      if (typeof child !== "string" || !allTypes.includes(child)) {
        return NextResponse.json(
          { error: `Invalid child type: ${child}` },
          { status: 400 }
        );
      }
    }
  }

  const updateData: Record<string, unknown> = {};
  if (icon !== undefined) updateData.icon = icon;
  if (allowedChildren !== undefined)
    updateData.allowedChildren = JSON.stringify(allowedChildren);

  const settings = await prisma.pageTypeSettings.upsert({
    where: { pageTypeName },
    create: {
      pageTypeName,
      icon: icon ?? "file",
      allowedChildren: allowedChildren
        ? JSON.stringify(allowedChildren)
        : "[]",
    },
    update: updateData,
  });

  return NextResponse.json({
    settings: {
      ...settings,
      allowedChildren: JSON.parse(settings.allowedChildren),
    },
  });
}
