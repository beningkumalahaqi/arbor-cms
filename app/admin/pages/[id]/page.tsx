"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageLayout } from "@/components/ui";
import { Card } from "@/components/ui";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { FormField } from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { PagePreview } from "@/components/admin/page-preview";
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
  const [showPreview, setShowPreview] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, pct)));
    }
    function handleMouseUp() {
      dragging.current = false;
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

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
        <div className="flex gap-2">
          <a
            href={page.fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
            View Live
          </a>
          <Button
            variant={showPreview ? "secondary" : "ghost"}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      }
    >
      <div ref={containerRef} className={showPreview ? "flex" : ""}>
      <div style={showPreview ? { width: `${splitPercent}%` } : undefined} className={showPreview ? "min-w-0 shrink-0 pr-0" : ""}>
      <Card className={showPreview ? "h-[calc(100vh-10rem)] overflow-hidden flex flex-col" : "max-w-2xl"}>
        <form onSubmit={handleSave} className={`space-y-4 ${showPreview ? "flex-1 overflow-auto p-0" : ""}`}>
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
                      rows={8}
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
      </div>

      {showPreview && page && (
        <>
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            className="flex w-2 shrink-0 cursor-col-resize items-center justify-center hover:bg-zinc-200 active:bg-zinc-300 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
          >
            <div className="h-8 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          <div className="min-w-0 flex-1">
            <Card className="sticky top-6 h-[calc(100vh-10rem)] overflow-hidden">
              <PagePreview
                pageType={page.pageType}
                content={content}
                fullPath={page.fullPath}
              />
            </Card>
          </div>
        </>
      )}
      </div>
    </PageLayout>
  );
}
