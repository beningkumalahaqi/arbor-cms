"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/ui";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { FormField } from "@/components/ui";
import { getPageType, type PageTypeDefinition } from "@/lib/page-types";

interface PageData {
  id: string;
  slug: string;
  fullPath: string;
  pageType: string;
  status: string;
  content: string;
}

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<PageData | null>(null);
  const [typeDef, setTypeDef] = useState<PageTypeDefinition | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    fetch(`/api/pages/${pageId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.page) {
          setPage(data.page);
          const parsed =
            typeof data.page.content === "string"
              ? JSON.parse(data.page.content)
              : data.page.content;
          setContent(parsed);
          setStatus(data.page.status);
          const td = getPageType(data.page.pageType);
          setTypeDef(td ?? null);
        }
        setLoading(false);
      });
  }, [pageId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, status }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    router.push("/admin/pages");
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this page?")) return;

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/admin/pages");
  }

  if (loading) {
    return (
      <PageLayout title="Edit Page">
        <p className="text-zinc-500">Loading...</p>
      </PageLayout>
    );
  }

  if (!page) {
    return (
      <PageLayout title="Page Not Found">
        <p className="text-zinc-500">This page does not exist.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`Edit: ${page.fullPath}`}
      description={`Type: ${page.pageType} • Slug: ${page.slug}`}
      actions={
        <Button variant="danger" onClick={handleDelete}>
          Delete
        </Button>
      }
    >
      <Card className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <FormField label="Status">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === "draft"}
                  onChange={() => setStatus("draft")}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                Draft
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === "published"}
                  onChange={() => setStatus("published")}
                  className="accent-zinc-900 dark:accent-zinc-100"
                />
                Published
              </label>
            </div>
          </FormField>

          {typeDef && (
            <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Content Properties
              </p>
              {typeDef.allowedProperties.map((prop) => (
                <FormField
                  key={prop.name}
                  label={`${prop.label}${prop.required ? " *" : ""}`}
                >
                  {prop.type === "text" ? (
                    <Input
                      value={content[prop.name] ?? ""}
                      onChange={(e) =>
                        setContent({ ...content, [prop.name]: e.target.value })
                      }
                      required={prop.required}
                    />
                  ) : (
                    <Textarea
                      value={content[prop.name] ?? ""}
                      onChange={(e) =>
                        setContent({ ...content, [prop.name]: e.target.value })
                      }
                      required={prop.required}
                      rows={6}
                    />
                  )}
                </FormField>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/pages")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </PageLayout>
  );
}
