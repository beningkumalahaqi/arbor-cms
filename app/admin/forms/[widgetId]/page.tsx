"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { PageLayout, Card, Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";

interface Submission {
  id: string;
  formName: string;
  formTypeId: string;
  pageId: string;
  data: Record<string, string>;
  createdAt: string;
}

export default function FormSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const paramId = params.widgetId as string;
  const byFormType = searchParams.get("by") === "formType";

  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [formName, setFormName] = useState("");
  const [fieldNames, setFieldNames] = useState<string[]>([]);

  useEffect(() => {
    const queryParam = byFormType
      ? `formTypeId=${paramId}`
      : `widgetId=${paramId}`;

    fetch(`/api/forms?${queryParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          const subs = data.submissions.map((s: { id: string; formName: string; formTypeId: string; pageId: string; data: string; createdAt: string }) => ({
            ...s,
            data: typeof s.data === "string" ? JSON.parse(s.data) : s.data,
          }));
          setSubmissions(subs);
          if (subs.length > 0) {
            setFormName(subs[0].formName);
            // Collect all unique field names across submissions
            const fields = new Set<string>();
            subs.forEach((s: Submission) => {
              Object.keys(s.data).forEach((k) => fields.add(k));
            });
            setFieldNames(Array.from(fields));
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [paramId, byFormType]);

  async function handleDelete(submissionId: string) {
    if (!confirm("Delete this submission?")) return;

    const res = await fetch(`/api/forms?id=${submissionId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    }
  }

  async function handleDeleteAll() {
    if (
      !confirm(
        `Delete ALL ${submissions.length} submissions for "${formName}"?`
      )
    )
      return;

    const queryParam = byFormType
      ? `formTypeId=${paramId}`
      : `widgetId=${paramId}`;

    const res = await fetch(`/api/forms?${queryParam}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setSubmissions([]);
    }
  }

  return (
    <PageLayout
      title={formName ? `Submissions: ${formName}` : "Form Submissions"}
      description={`${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
      actions={
        <div className="flex gap-2">
          {submissions.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
              Delete All
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/forms")}
          >
            ← Back to Forms
          </Button>
        </div>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : submissions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No submissions yet for this form.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {fieldNames.map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(sub.createdAt).toLocaleString()}
                    </TableCell>
                    {fieldNames.map((field) => (
                      <TableCell key={field} className="max-w-60 truncate">
                        {sub.data[field] ?? "—"}
                      </TableCell>
                    ))}
                    <TableCell>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete submission"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </PageLayout>
  );
}
