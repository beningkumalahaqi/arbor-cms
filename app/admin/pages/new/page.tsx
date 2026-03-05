"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/ui";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Textarea } from "@/components/ui";
import { Select } from "@/components/ui";
import { FormField } from "@/components/ui";
import { getAllPageTypes, type PageTypeDefinition } from "@/lib/page-types";

interface ParentPage {
  id: string;
  fullPath: string;
  slug: string;
}

export default function NewPagePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pageTypes] = useState<PageTypeDefinition[]>(getAllPageTypes());
  const [parents, setParents] = useState<ParentPage[]>([]);
  const [form, setForm] = useState({
    slug: "",
    pageType: "",
    parentId: "",
  });
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/pages")
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) setParents(data.pages);
      });
  }, []);

  const selectedType = pageTypes.find((pt) => pt.name === form.pageType);

  useEffect(() => {
    if (selectedType) {
      const defaults: Record<string, string> = {};
      for (const prop of selectedType.allowedProperties) {
        defaults[prop.name] = prop.defaultValue ?? "";
      }
      setContent(defaults);
    }
  }, [selectedType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug,
        pageType: form.pageType,
        parentId: form.parentId || null,
        content,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setSubmitting(false);
      return;
    }

    router.push("/admin/pages");
  }

  return (
    <PageLayout title="Create New Page" description="Add a new page to the tree.">
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <FormField label="Page Type">
            <Select
              value={form.pageType}
              onChange={(e) =>
                setForm({ ...form, pageType: e.target.value })
              }
              options={pageTypes.map((pt) => ({
                value: pt.name,
                label: pt.label,
              }))}
              placeholder="Select a page type"
              required
            />
          </FormField>

          <FormField label="Slug">
            <Input
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="my-page"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </FormField>

          <FormField label="Parent Page">
            <Select
              value={form.parentId}
              onChange={(e) =>
                setForm({ ...form, parentId: e.target.value })
              }
              options={[
                { value: "", label: "None (root level)" },
                ...parents.map((p) => ({
                  value: p.id,
                  label: p.fullPath,
                })),
              ]}
            />
          </FormField>

          {selectedType && (
            <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Content Properties
              </p>
              {selectedType.allowedProperties.map((prop) => (
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
                      rows={4}
                    />
                  )}
                </FormField>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Page"}
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
