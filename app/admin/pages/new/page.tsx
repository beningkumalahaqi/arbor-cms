"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageLayout, Card, CardContent, Button, Input, Textarea, FormField, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
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
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <FormField label="Parent Page">
            <Select
              value={form.parentId}
              onValueChange={(value) =>
                setForm({ ...form, parentId: value === "__none__" ? "" : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None (root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (root level)</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullPath}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Page Type">
            <Select
              value={form.pageType}
              onValueChange={(value) =>
                setForm({ ...form, pageType: value })
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a page type" />
              </SelectTrigger>
              <SelectContent>
                {availablePageTypes.map((pt) => (
                  <SelectItem key={pt.name} value={pt.name}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {isHome ? (
            <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
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
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-foreground">
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
                  ) : prop.type === "image" ? (
                    <ImageField
                      value={content[prop.name] ?? ""}
                      onChange={(val) =>
                        setContent({ ...content, [prop.name]: val })
                      }
                      required={prop.required}
                    />
                  ) : (
                    <RichTextEditor
                      value={content[prop.name] ?? ""}
                      onChange={(val) =>
                        setContent({ ...content, [prop.name]: val })
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
