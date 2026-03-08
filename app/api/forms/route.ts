import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/forms — Get all form submission groups (grouped by formTypeId or widgetId fallback)
// or GET /api/forms?widgetId=xxx — Get submissions for a specific form widget
// or GET /api/forms?formTypeId=xxx — Get submissions for a specific form type
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const widgetId = searchParams.get("widgetId");
  const formTypeId = searchParams.get("formTypeId");

  // Get submissions for a specific form type
  if (formTypeId) {
    const submissions = await prisma.formSubmission.findMany({
      where: { formTypeId },
      orderBy: { createdAt: "desc" },
    });

    const parsed = submissions.map((s) => ({
      id: s.id,
      widgetId: s.widgetId,
      formTypeId: s.formTypeId,
      formName: s.formName,
      pageId: s.pageId,
      data: JSON.parse(s.data),
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ submissions: parsed });
  }

  if (widgetId) {
    // Get submissions for a specific form widget
    const submissions = await prisma.formSubmission.findMany({
      where: { widgetId },
      orderBy: { createdAt: "desc" },
    });

    const parsed = submissions.map((s) => ({
      id: s.id,
      widgetId: s.widgetId,
      formTypeId: s.formTypeId,
      formName: s.formName,
      pageId: s.pageId,
      data: JSON.parse(s.data),
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ submissions: parsed });
  }

  // Get all unique form groups — grouped by formTypeId when available, widgetId as fallback
  const allSubmissions = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Load all form types to enrich the response
  const allFormTypes = await prisma.formType.findMany();
  const formTypeMap = new Map(allFormTypes.map((ft) => [ft.id, ft]));

  // Group by formTypeId (preferred) or widgetId (legacy fallback)
  const formMap = new Map<
    string,
    {
      groupKey: string;
      formTypeId: string;
      formTypeName: string;
      widgetId: string;
      formName: string;
      pageId: string;
      count: number;
      lastSubmission: string;
    }
  >();

  for (const sub of allSubmissions) {
    // Use formTypeId as group key when available, else fall back to widgetId
    const groupKey = sub.formTypeId ? `ft:${sub.formTypeId}` : `wid:${sub.widgetId}`;
    const existing = formMap.get(groupKey);

    const ft = sub.formTypeId ? formTypeMap.get(sub.formTypeId) : null;
    const formTypeName = ft ? ft.name : "";

    if (existing) {
      existing.count += 1;
    } else {
      formMap.set(groupKey, {
        groupKey,
        formTypeId: sub.formTypeId,
        formTypeName,
        widgetId: sub.widgetId,
        formName: sub.formName,
        pageId: sub.pageId,
        count: 1,
        lastSubmission: sub.createdAt.toISOString(),
      });
    }
  }

  const forms = Array.from(formMap.values());

  return NextResponse.json({ forms });
}

// DELETE /api/forms?id=xxx — Delete a single submission
// DELETE /api/forms?widgetId=xxx — Delete all submissions for a widget
// DELETE /api/forms?formTypeId=xxx — Delete all submissions for a form type
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const widgetId = searchParams.get("widgetId");
  const formTypeId = searchParams.get("formTypeId");

  if (formTypeId) {
    await prisma.formSubmission.deleteMany({ where: { formTypeId } });
    return NextResponse.json({ success: true });
  }

  if (widgetId) {
    await prisma.formSubmission.deleteMany({ where: { widgetId } });
    return NextResponse.json({ success: true });
  }

  if (id) {
    await prisma.formSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "id, widgetId, or formTypeId is required." }, { status: 400 });
}
