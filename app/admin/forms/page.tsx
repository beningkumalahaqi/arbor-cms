"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLayout, Card, Badge, Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

interface FormGroup {
  groupKey: string;
  formTypeId: string;
  formTypeName: string;
  widgetId: string;
  formName: string;
  pageId: string;
  count: number;
  lastSubmission: string | null;
}

export default function FormsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<FormGroup[]>([]);

  useEffect(() => {
    fetch("/api/forms")
      .then((res) => res.json())
      .then((data) => {
        if (data.forms) setForms(data.forms);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleView(form: FormGroup) {
    // Navigate by formTypeId when available, fall back to widgetId
    if (form.formTypeId) {
      router.push(`/admin/forms/${form.formTypeId}?by=formType`);
    } else {
      router.push(`/admin/forms/${form.widgetId}`);
    }
  }

  return (
    <PageLayout
      title="Form Submissions"
      description="View submissions from Form widgets across your site"
    >
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : forms.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No form submissions yet. Add a Form widget to a page to start
            collecting submissions.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Name</TableHead>
                <TableHead>Form Type</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead>Last Submission</TableHead>
                <TableHead className="w-25">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((form) => (
                <TableRow key={form.groupKey}>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {form.formName}
                    </span>
                  </TableCell>
                  <TableCell>
                    {form.formTypeName ? (
                      <Badge variant="secondary">{form.formTypeName}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No type linked
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{form.count}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {form.lastSubmission
                      ? new Date(form.lastSubmission).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(form)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PageLayout>
  );
}
