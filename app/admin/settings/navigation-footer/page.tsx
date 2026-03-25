"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, PageLayout } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";

interface SiteSettingsData {
  navigationEnabled: number;
  navigationLogo: string;
  navigationTitle: string;
  footerEnabled: number;
  footerLogo: string;
  footerText: string;
}

export default function NavigationFooterSettingsPage() {
  const [settings, setSettings] = useState<SiteSettingsData>({
    navigationEnabled: 1,
    navigationLogo: "",
    navigationTitle: "Arbor CMS",
    footerEnabled: 1,
    footerLogo: "",
    footerText: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        const incoming = {
          navigationEnabled: data.settings?.navigationEnabled ?? 1,
          navigationLogo: data.settings?.navigationLogo ?? "",
          navigationTitle: data.settings?.navigationTitle ?? "Arbor CMS",
          footerEnabled: data.settings?.footerEnabled ?? 1,
          footerLogo: data.settings?.footerLogo ?? "",
          footerText: data.settings?.footerText ?? "",
        };
        setSettings(incoming);
        setLoaded(true);
      });
  }, []);

  const savePartial = useCallback(async (partial: Partial<SiteSettingsData>) => {
    setSaving(true);
    try {
      await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
    } finally {
      setSaving(false);
    }
  }, []);

  function updateSetting<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    void savePartial({ [key]: value });
  }

  return (
    <PageLayout
      title="Navigation and Footer Settings"
      description="Manage public site navigation and footer content."
    >
      <div className="max-w-2xl space-y-6">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings">Back to Settings</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>
              Configure navigation visibility, title, and logo.
            </CardDescription>
          </CardHeader>
          {loaded && (
            <div className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enable Navigation</label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.navigationEnabled === 1}
                    onChange={(event) =>
                      updateSetting("navigationEnabled", event.target.checked ? 1 : 0)
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Show navigation bar on the live site
                  </span>
                </label>
              </div>

              {settings.navigationEnabled === 1 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Site Title</label>
                    <Input
                      value={settings.navigationTitle}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, navigationTitle: event.target.value }))
                      }
                      onBlur={() => void savePartial({ navigationTitle: settings.navigationTitle })}
                      placeholder="Arbor CMS"
                    />
                    <p className="text-xs text-muted-foreground">
                      Displayed next to the logo in the navigation bar.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Navigation Logo</label>
                    <ImageField
                      value={settings.navigationLogo}
                      onChange={(value) => updateSetting("navigationLogo", value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select an image from the file manager to use as the navigation logo.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Footer</CardTitle>
            <CardDescription>
              Configure footer visibility, text, and logo.
            </CardDescription>
          </CardHeader>
          {loaded && (
            <div className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enable Footer</label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.footerEnabled === 1}
                    onChange={(event) =>
                      updateSetting("footerEnabled", event.target.checked ? 1 : 0)
                    }
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Show footer on the live site
                  </span>
                </label>
              </div>

              {settings.footerEnabled === 1 && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Footer Text</label>
                    <Input
                      value={settings.footerText}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, footerText: event.target.value }))
                      }
                      onBlur={() => void savePartial({ footerText: settings.footerText })}
                      placeholder="Your company name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Text displayed in the footer alongside the copyright notice.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Footer Logo</label>
                    <ImageField
                      value={settings.footerLogo}
                      onChange={(value) => updateSetting("footerLogo", value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select an image from the file manager to use as the footer logo.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        {saving && <p className="text-xs text-muted-foreground">Saving...</p>}
      </div>
    </PageLayout>
  );
}
