"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageLayout, Card, Button, Input, FormField, RadioGroup, RadioGroupItem, Label, Badge } from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { PagePreview } from "@/components/admin/page-preview";
import { WidgetEditor } from "@/components/admin/widget-editor";
import { getPageType, type PageTypeDefinition } from "@/lib/page-types";
import type { WidgetAreaDefinition, WidgetInstance } from "@/lib/widgets/types";

interface PageData {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  pageType: string;
  status: string;
  content: string;
  parentId: string | null;
  showInNav: number;
  navLabel: string;
  seoTitle: string;
  seoDescription: string;
  seoCanonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
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
  const [showInNav, setShowInNav] = useState(false);
  const [navLabel, setNavLabel] = useState("");
  // Page identity
  const [pageName, setPageName] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [slugChanged, setSlugChanged] = useState(false);
  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoCanonical, setSeoCanonical] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogUrl, setOgUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  const [showPreview, setShowPreview] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50);
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "widgets">("content");
  const [widgetAreas, setWidgetAreas] = useState<WidgetAreaDefinition[]>([]);
  const [pageWidgets, setPageWidgets] = useState<WidgetInstance[]>([]);
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
          setShowInNav(data.page.showInNav === 1);
          setNavLabel(data.page.navLabel ?? "");
          setPageName(data.page.name ?? "");
          setPageSlug(data.page.slug ?? "");
          setSeoTitle(data.page.seoTitle ?? "");
          setSeoDescription(data.page.seoDescription ?? "");
          setSeoCanonical(data.page.seoCanonical ?? "");
          setOgTitle(data.page.ogTitle ?? "");
          setOgDescription(data.page.ogDescription ?? "");
          setOgUrl(data.page.ogUrl ?? "");
          setOgImage(data.page.ogImage ?? "");
          const td = getPageType(data.page.pageType);
          setTypeDef(td ?? null);

          // Fetch widget areas for this page type
          fetch(`/api/widgets/areas?pageType=${data.page.pageType}`)
            .then((r) => r.json())
            .then((areaData) => {
              if (areaData.areas) {
                setWidgetAreas(areaData.areas);
              }
            })
            .catch(() => {});

          // Fetch existing widgets for this page
          fetch(`/api/widgets?pageId=${pageId}`)
            .then((r) => r.json())
            .then((widgetData) => {
              if (widgetData.widgets) {
                const parsed = widgetData.widgets.map((w: { id: string; pageId: string; area: string; type: string; props: string; sortOrder: number; parentId: string | null; slot: string }) => ({
                  ...w,
                  props: typeof w.props === "string" ? JSON.parse(w.props) : w.props,
                }));
                setPageWidgets(parsed);
              }
            })
            .catch(() => {});
        }
        setLoading(false);
      });
  }, [pageId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // If slug changed, update it first (separate request that rebuilds fullPath)
    if (slugChanged && page && pageSlug !== page.slug) {
      const slugRes = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: pageSlug }),
      });
      const slugData = await slugRes.json();
      if (!slugRes.ok) {
        setError(slugData.error);
        setSubmitting(false);
        return;
      }
      // Update local page state with new fullPath/slug
      setPage((prev) => prev ? { ...prev, slug: slugData.page.slug, fullPath: slugData.page.fullPath } : prev);
      setSlugChanged(false);
    }

    const res = await fetch(`/api/pages/${pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: pageName,
        content,
        status,
        showInNav,
        navLabel,
        seoTitle,
        seoDescription,
        seoCanonical,
        ogTitle,
        ogDescription,
        ogUrl,
        ogImage,
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
        <p className="text-muted-foreground">Loading...</p>
      </PageLayout>
    );
  }

  if (!page) {
    return (
      <PageLayout title="Page Not Found">
        <p className="text-muted-foreground">This page does not exist.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={pageName || page.fullPath}
      description={`Type: ${page.pageType} • Path: ${page.fullPath}`}
      actions={
        <div className="flex gap-2">
          <a
            href={page.fullPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
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
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      }
    >
      <div ref={containerRef} className={showPreview ? "flex" : ""}>
      <div style={showPreview ? { width: `${splitPercent}%` } : undefined} className={showPreview ? "min-w-0 shrink-0 pr-0" : ""}>
      <Card className={showPreview ? "h-[calc(100vh-10rem)] overflow-hidden flex flex-col" : "max-w-2xl"}>
        {/* Tab Header */}
        <div className="flex items-center border-b bg-muted/30">
          <button
            onClick={() => setActiveTab("content")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "content"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "seo"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            SEO
          </button>
          {widgetAreas.length > 0 && (
            <button
              onClick={() => setActiveTab("widgets")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "widgets"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Widgets
              {pageWidgets.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {pageWidgets.length}
                </Badge>
              )}
            </button>
          )}
        </div>

        {/* Content Tab */}
        <div className={activeTab === "content" ? "flex-1 overflow-auto" : "hidden"}>
        <form onSubmit={handleSave} className={`space-y-4 ${showPreview ? "flex-1 overflow-auto p-4" : "p-4"}`}>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Page Identity */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">Page Identity</p>
            <FormField label="Name">
              <Input
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder={page.slug ? page.slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Home"}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display name shown in the admin. Defaults to slug if left empty.
              </p>
            </FormField>
            {page.pageType !== "home" && (
              <FormField label="Slug">
                <Input
                  value={pageSlug}
                  onChange={(e) => {
                    setPageSlug(e.target.value);
                    setSlugChanged(true);
                  }}
                  placeholder="page-slug"
                />
                {slugChanged && pageSlug !== page.slug && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠ Changing the slug will update the page URL and all child page URLs.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  URL segment. Current path: <code className="font-mono">{page.fullPath}</code>
                </p>
              </FormField>
            )}
          </div>

          <FormField label="Status">
            <RadioGroup value={status} onValueChange={setStatus} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="draft" id="status-draft" />
                <Label htmlFor="status-draft">Draft</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="published" id="status-published" />
                <Label htmlFor="status-published">Published</Label>
              </div>
            </RadioGroup>
          </FormField>

          {!page.parentId && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Navigation</p>
              <FormField label="Show in Navigation">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInNav}
                    onChange={(e) => setShowInNav(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Display this page in the site navigation bar
                  </span>
                </label>
              </FormField>
              {showInNav && (
                <FormField label="Navigation Label">
                  <Input
                    value={navLabel}
                    onChange={(e) => setNavLabel(e.target.value)}
                    placeholder={page.slug ? page.slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "Home"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use the default label based on slug
                  </p>
                </FormField>
              )}
            </div>
          )}

          {typeDef && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-foreground">
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
        </div>

        {/* SEO Tab */}
        <div className={activeTab === "seo" ? "flex-1 overflow-auto" : "hidden"}>
          <form onSubmit={handleSave} className={`space-y-4 ${showPreview ? "flex-1 overflow-auto p-4" : "p-4"}`}>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">SEO</p>
              <FormField label="Title">
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Page title for search engines"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shown in browser tab and search results. Defaults to page name.
                </p>
              </FormField>
              <FormField label="Description">
                <Input
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Short description for search engines"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Shown in search result snippets. Recommended 150–160 characters.
                </p>
              </FormField>
              <FormField label="Canonical URL">
                <Input
                  value={seoCanonical}
                  onChange={(e) => setSeoCanonical(e.target.value)}
                  placeholder="https://example.com/page"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to use the page&apos;s own URL.
                </p>
              </FormField>
            </div>

            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Open Graph</p>
              <p className="text-xs text-muted-foreground">
                Controls how this page appears when shared on social media. Falls back to SEO fields when left empty.
              </p>
              <FormField label="OG Title">
                <Input
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder={seoTitle || "Defaults to SEO title"}
                />
              </FormField>
              <FormField label="OG Description">
                <Input
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  placeholder={seoDescription || "Defaults to SEO description"}
                />
              </FormField>
              <FormField label="OG URL">
                <Input
                  value={ogUrl}
                  onChange={(e) => setOgUrl(e.target.value)}
                  placeholder={seoCanonical || "Defaults to canonical URL"}
                />
              </FormField>
              <FormField label="OG Image">
                <ImageField
                  value={ogImage}
                  onChange={setOgImage}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Image shown when the page is shared on social media.
                </p>
              </FormField>
            </div>

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
        </div>

        {/* Widgets Tab */}
        {widgetAreas.length > 0 && (
          <div className={activeTab === "widgets" ? "flex-1 overflow-auto p-4" : "hidden"}>
            <WidgetEditor
              pageId={pageId}
              areas={widgetAreas}
              widgets={pageWidgets}
              onWidgetsChange={setPageWidgets}
            />
          </div>
        )}

      </Card>
      </div>

      {showPreview && page && (
        <>
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            className="flex w-2 shrink-0 cursor-col-resize items-center justify-center hover:bg-accent active:bg-accent/80"
          >
            <div className="h-8 w-0.5 rounded-full bg-border" />
          </div>
          <div className="min-w-0 flex-1">
            <Card className="sticky top-6 h-[calc(100vh-10rem)] overflow-hidden">
              <PagePreview
                pageType={page.pageType}
                content={content}
                fullPath={page.fullPath}
                pageId={pageId}
                widgets={pageWidgets}
              />
            </Card>
          </div>
        </>
      )}
      </div>
    </PageLayout>
  );
}
