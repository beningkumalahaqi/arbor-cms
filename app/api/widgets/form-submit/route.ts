import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/widgets/form-submit — Handle public form submissions
// Public endpoint (no auth required) — called from the frontend Form widget
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { widgetId, formName, pageId, data, formTypeId } = body;

  if (!widgetId || !formName || !pageId || !data) {
    return NextResponse.json(
      { error: "widgetId, formName, pageId, and data are required." },
      { status: 400 }
    );
  }

  // Verify the widget exists and get its props
  const widget = await prisma.widget.findUnique({ where: { id: widgetId } });
  if (!widget) {
    return NextResponse.json(
      { error: "Form widget not found." },
      { status: 404 }
    );
  }

  // Resolve formTypeId: use provided one, or find/create from widget props
  let resolvedFormTypeId = formTypeId || "";

  if (!resolvedFormTypeId) {
    // Try to get formTypeId from the widget's own props
    try {
      const widgetProps = JSON.parse(widget.props);
      if (widgetProps.formTypeId) {
        resolvedFormTypeId = widgetProps.formTypeId;
      }
    } catch {
      // ignore parse errors
    }
  }

  // If we still don't have a formTypeId, auto-create a FormType from the widget's elements
  if (!resolvedFormTypeId) {
    try {
      const widgetProps = JSON.parse(widget.props);
      const elements = widgetProps.elements || [];

      const newFormType = await prisma.formType.create({
        data: {
          name: formName,
          elements: JSON.stringify(elements),
        },
      });
      resolvedFormTypeId = newFormType.id;

      // Update the widget to link to this new FormType
      const updatedProps = { ...widgetProps, formTypeId: newFormType.id };
      await prisma.widget.update({
        where: { id: widgetId },
        data: { props: JSON.stringify(updatedProps) },
      });
    } catch {
      // If auto-creation fails, proceed without formTypeId
    }
  }

  // Verify the FormType still exists (it may have been deleted)
  if (resolvedFormTypeId) {
    const formType = await prisma.formType.findUnique({
      where: { id: resolvedFormTypeId },
    });
    if (!formType) {
      resolvedFormTypeId = "";
    }
  }

  // Create the submission
  const submission = await prisma.formSubmission.create({
    data: {
      widgetId,
      formTypeId: resolvedFormTypeId,
      formName,
      pageId,
      data: JSON.stringify(data),
    },
  });

  return NextResponse.json({ submission: { id: submission.id } }, { status: 201 });
}
