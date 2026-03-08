"use client";

import { useEffect, useState } from "react";
import type { WidgetInstance } from "../types";

interface PageItem {
  id: string;
  slug: string;
  fullPath: string;
  pageType: string;
  content: string;
}

export function PageListRenderer({ widget, fullPath }: { widget: WidgetInstance; fullPath: string }) {
  const {
    source = "children",
    pageType = "",
    limit = 10,
    displayStyle = "list",
    showDescription = true,
  } = widget.props as {
    source: string;
    pageType: string;
    limit: number;
    displayStyle: string;
    showDescription: boolean;
  };

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({
      source,
      pageType,
      limit: String(limit),
      fullPath,
    });

    fetch(`/api/widgets/page-list?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [source, pageType, limit, fullPath]);

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading pages...</div>;
  }

  if (pages.length === 0) {
    return <div className="text-muted-foreground text-sm">No pages found.</div>;
  }

  function getTitle(page: PageItem): string {
    try {
      const content = JSON.parse(page.content);
      return content.title || page.slug || "Untitled";
    } catch {
      return page.slug || "Untitled";
    }
  }

  function getDescription(page: PageItem): string {
    try {
      const content = JSON.parse(page.content);
      // Strip HTML tags for description preview
      const raw = content.description || content.content || "";
      return raw.replace(/<[^>]*>/g, "").slice(0, 160);
    } catch {
      return "";
    }
  }

  if (displayStyle === "cards") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <a
            key={page.id}
            href={page.fullPath}
            className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
          >
            <h3 className="font-semibold text-card-foreground">{getTitle(page)}</h3>
            {showDescription && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                {getDescription(page)}
              </p>
            )}
          </a>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pages.map((page) => (
        <li key={page.id}>
          <a
            href={page.fullPath}
            className="block rounded-md p-3 transition-colors hover:bg-accent"
          >
            <span className="font-medium text-foreground">{getTitle(page)}</span>
            {showDescription && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                {getDescription(page)}
              </p>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}
