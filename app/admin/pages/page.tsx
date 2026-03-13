"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/ui";
import { Button } from "@/components/ui";
import { PageTree } from "@/components/admin/page-tree";

interface PageData {
  id: string;
  name: string;
  slug: string;
  fullPath: string;
  pageType: string;
  status: string;
  parentId: string | null;
  sortOrder: number;
}

interface SettingsData {
  pageTypeName: string;
  icon: string;
  allowedChildren: string;
}

export default function PagesListPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [settings, setSettings] = useState<
    Record<string, { icon: string; allowedChildren: string[] }>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pages?tree=true")
      .then((res) => res.json())
      .then((data) => {
        if (data.pages) setPages(data.pages);
        if (data.settings) {
          const map: Record<
            string,
            { icon: string; allowedChildren: string[] }
          > = {};
          for (const s of data.settings as SettingsData[]) {
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
        setLoading(false);
      });
  }, []);

  return (
    <PageLayout
      title="Pages"
      description="Manage your page tree."
      actions={
        <Link href="/admin/pages/new">
          <Button>New Page</Button>
        </Link>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <PageTree pages={pages} settings={settings} />
      )}
    </PageLayout>
  );
}
