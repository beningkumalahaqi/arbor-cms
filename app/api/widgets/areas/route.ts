import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTemplateAreas } from "@/lib/page-template";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get("pageType");

  if (!pageType) {
    return NextResponse.json({ error: "pageType is required" }, { status: 400 });
  }

  const areas = getTemplateAreas(pageType);
  if (!areas) {
    return NextResponse.json({ error: "No template areas defined for this page type" }, { status: 404 });
  }

  return NextResponse.json({ areas });
}
