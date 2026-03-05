"use client";

import { useState, useEffect, useMemo } from "react";
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
  pageType: string;
}

interface SettingsData {
  pageTypeName: string;
  icon: string;
  allowedChildren: string;
}

interface ParsedSettings {
  [pageTypeName: string]: {
    icon: string;
    allowedChildren: string[];
  };
}

export default function NewPagePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pageTypes] = useState<PageTypeDefinition[]>(getAllPageTypes());
  const [parents, setParents] = useState<ParentPage[]>([]);
  const [settings, setSettings] = useState<ParsedSettings>({});
  const [form, setForm] = useState({
    slug: "",
    pageType: "",
    parentId: "",
  });
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/pages").then((r) => r.json()),
      fetch("/api/page-types/settings").then((r) => r.json()),
    ]).then(([pagesData, settingsData]) => {
      if (pagesData.pages) setParents(pagesData.pages);
      if (settingsData.settings) {
        const map: ParsedSettings = {};
        for (const s of settingsData.settings as SettingsData[]) {
          map[s.pageTypeName] = {
            icon: s.icon,
            allowedChildren:
              typeof s.allowedChildren === "string"
                ? JSON.parse(s.allowedChildren)
                : s.allowedChildren,
          };
        }
        setSettings(map);
      }
    });
  }, []);

  const selectedType = pageTypes.find((pt) => pt.name === form.pageType);
  const isHome = form.pageType === "home";

  // Filter page types based on parent's allowed children
  const availablePageTypes = useMemo(() => {
    if (!form.parentId) {
      // Root-level: any type (except home if it already exists)
      return pageTypes;
    }
    const parent = parents.find((p) => p.id === form.parentId);
    if (!parent) return pageTypes;

    const parentSetting = settings[parent.pageType];
    if (!parentSetting || parentSetting.allowedChildren.length === 0) {
      // No restriction
      return pageTypes;
    }
    return pageTypes.filter((pt) =>
      parentSetting.allowedChildren.includes(pt.name)
    );
  }, [form.parentId, parents, settings, pageTypes]);

  useEffect(() => {
    if (selectedType) {
      const defaults: Record<string, string> = {};
      for (const prop of selectedType.allowedProperties) {
        defaults[prop.name] = prop.defaultValue ?? "";
      }
      setContent(defaults);
    }
    // Home type: clear slug and parent since it always serves /
    if (isHome) {
      setForm((prev) => ({ ...prev, slug: "", parentId: "" }));
    }
  }, [selectedType, isHome]);

  // Reset page type selection when parent changes and selected type not in available list
  useEffect(() => {
    if (
      form.pageType &&
      !availablePageTypes.some((pt) => pt.name === form.pageType)
    ) {
      setForm((prev) => ({ ...prev, pageType: "" }));
    }
  }, [availablePageTypes, form.pageType]);

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

          <FormField label="Page Type">
            <Select
              value={form.pageType}
              onChange={(e) =>
                setForm({ ...form, pageType: e.target.value })
              }
              options={availablePageTypes.map((pt) => ({
                value: pt.name,
                label: pt.label,
              }))}
              placeholder="Select a page type"
              required
            />
          </FormField>

          {isHome ? (
            <div className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Home page always serves <span className="font-mono font-medium">/</span>. Slug and parent are set automatically.
            </div>
          ) : (
            form.pageType && (
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
            )
          )}

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
