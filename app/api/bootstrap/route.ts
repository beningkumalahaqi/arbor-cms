import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasSuperAdmin, createSuperAdmin } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";
import { getPageType } from "@/lib/page-types";
import { buildDefaultContent } from "@/lib/properties";

export async function POST(request: NextRequest) {
  const exists = await hasSuperAdmin();
  if (exists) {
    return NextResponse.json(
      { error: "SuperAdmin already exists. Registration is disabled." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return NextResponse.json(
      { error: "Email, name, and password are required." },
      { status: 400 }
    );
  }

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await createSuperAdmin(email, name, password);

  // Auto-create the home page if it doesn't exist
  const existingHome = await prisma.page.findFirst({
    where: { pageType: "home" },
  });
  if (!existingHome) {
    const homeType = getPageType("home")!;
    const defaultContent = buildDefaultContent(homeType.allowedProperties);
    await prisma.page.create({
      data: {
        slug: "",
        fullPath: "/",
        parentId: null,
        pageType: "home",
        content: JSON.stringify(defaultContent),
        status: "published",
      },
    });

    // Also create default settings for the home page type
    await prisma.pageTypeSettings.upsert({
      where: { pageTypeName: "home" },
      create: {
        pageTypeName: "home",
        icon: "home",
        allowedChildren: JSON.stringify(["content"]),
      },
      update: {},
    });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}

export async function GET() {
  const exists = await hasSuperAdmin();
  return NextResponse.json({ hasSuperAdmin: exists });
}
