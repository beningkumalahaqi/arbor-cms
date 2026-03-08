import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/form-types — List all form types
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formTypes = await prisma.formType.findMany({
    orderBy: { createdAt: "desc" },
  });

  const parsed = formTypes.map((ft) => ({
    id: ft.id,
    name: ft.name,
    elements: JSON.parse(ft.elements),
    createdAt: ft.createdAt.toISOString(),
    updatedAt: ft.updatedAt.toISOString(),
  }));

  return NextResponse.json({ formTypes: parsed });
}

// POST /api/form-types — Create a new form type
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, elements } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "name is required." },
      { status: 400 }
    );
  }

  if (!elements || !Array.isArray(elements)) {
    return NextResponse.json(
      { error: "elements must be an array." },
      { status: 400 }
    );
  }

  const formType = await prisma.formType.create({
    data: {
      name: name.trim(),
      elements: JSON.stringify(elements),
    },
  });

  return NextResponse.json(
    {
      formType: {
        id: formType.id,
        name: formType.name,
        elements: JSON.parse(formType.elements),
        createdAt: formType.createdAt.toISOString(),
        updatedAt: formType.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  );
}

// DELETE /api/form-types?id=xxx — Delete a form type
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required." }, { status: 400 });
  }

  // Check if there are submissions using this form type
  const submissionCount = await prisma.formSubmission.count({
    where: { formTypeId: id },
  });

  await prisma.formType.delete({ where: { id } });

  // Clear formTypeId references in submissions (orphan them rather than delete data)
  if (submissionCount > 0) {
    await prisma.formSubmission.updateMany({
      where: { formTypeId: id },
      data: { formTypeId: "" },
    });
  }

  return NextResponse.json({ success: true });
}
