"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTheme, type Theme } from "@/components/theme-provider";
import { PageLayout } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui";
import { ImageField } from "@/components/admin/image-field";
import {
  dashboardModuleDefinitions,
  parseDashboardModules,
  type DashboardModuleConfig,
  type DashboardModuleId,
} from "@/lib/admin/dashboard-modules";

const themeOptions: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function ThemeSelector({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (t: Theme) => void;
}) {
  return (
    <div className="flex gap-2 rounded-lg border bg-muted/50 p-1">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SiteSettingsData {
  navigationEnabled: number;
  navigationLogo: string;
  navigationTitle: string;
  footerEnabled: number;
  footerLogo: string;
  footerText: string;
  dashboardModules: string;
}

export default function SettingsPage() {
  const { adminTheme, siteTheme, setAdminTheme, setSiteTheme } = useTheme();
  const [settings, setSettings] = useState<SiteSettingsData>({
    navigationEnabled: 1,
    navigationLogo: "",
    navigationTitle: "Arbor CMS",
    footerEnabled: 1,
    footerLogo: "",
    footerText: "",
    dashboardModules: "[]",
  });
  const [dashboardModules, setDashboardModules] = useState<DashboardModuleConfig[]>(
    parseDashboardModules("[]")
  );
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const incoming = {
            navigationEnabled: data.settings.navigationEnabled ?? 1,
            navigationLogo: data.settings.navigationLogo ?? "",
            navigationTitle: data.settings.navigationTitle ?? "Arbor CMS",
            footerEnabled: data.settings.footerEnabled ?? 1,
            footerLogo: data.settings.footerLogo ?? "",
            footerText: data.settings.footerText ?? "",
            dashboardModules: data.settings.dashboardModules ?? "[]",
          };
          setSettings(incoming);
          setDashboardModules(parseDashboardModules(incoming.dashboardModules));
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = useCallback(async (updated: Partial<SiteSettingsData>) => {
    setSaving(true);
    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setSaving(false);
  }, []);

  function updateSetting<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    void handleSave({ [key]: value });
  }

  function updateDashboardModules(next: DashboardModuleConfig[]) {
    setDashboardModules(next);
    const serialized = JSON.stringify(next);
    setSettings((current) => ({ ...current, dashboardModules: serialized }));
    void handleSave({ dashboardModules: serialized });
  }

  function toggleDashboardModule(id: DashboardModuleId) {
    const next = dashboardModules.map((module) =>
      module.id === id ? { ...module, enabled: !module.enabled } : module
    );
    updateDashboardModules(next);
  }

  function toggleDashboardFavorite(id: DashboardModuleId) {
    const next = dashboardModules.map((module) =>
      module.id === id ? { ...module, favorite: !module.favorite } : module
    );
    updateDashboardModules(next);
  }

  return (
    <PageLayout
      title="Settings"
      description="Manage your CMS preferences and configuration."
    >
      <div className="max-w-3xl space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Theme and admin layout options.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Control the appearance of the admin interface and the public site independently.
                Auto will match your operating system setting.
              </CardDescription>
            </CardHeader>
            <div className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">CMS Admin</label>
                <ThemeSelector value={adminTheme} onChange={setAdminTheme} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Live Site</label>
                <ThemeSelector value={siteTheme} onChange={setSiteTheme} />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>
                Choose which modules appear as quick access cards on the dashboard and set their pinned state.
              </CardDescription>
            </CardHeader>
            {loaded && (
              <div className="space-y-3 px-6 pb-6">
                {dashboardModuleDefinitions.map((module) => {
                  const config = dashboardModules.find((item) => item.id === module.id);
                  if (!config) return null;

                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{module.title}</p>
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleDashboardFavorite(module.id)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={config.favorite ? "Remove favorite" : "Mark favorite"}
                          title={config.favorite ? "Pinned" : "Pin to top"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={config.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        </button>
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={() => toggleDashboardModule(module.id)}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          Show
                        </label>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Drag and drop card order from the dashboard quick access section.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure live site structure and integrations.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
              <CardDescription>
                Configure the navigation bar displayed on the public site.
                Enable or disable it, set a logo, and choose a site title.
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
                      onChange={(e) =>
                        updateSetting("navigationEnabled", e.target.checked ? 1 : 0)
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
                        onChange={(e) =>
                          setSettings({ ...settings, navigationTitle: e.target.value })
                        }
                        onBlur={() => handleSave({ navigationTitle: settings.navigationTitle })}
                        placeholder="Arbor CMS"
                      />
                      <p className="text-xs text-muted-foreground">
                        Displayed next to the logo in the navigation bar
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Navigation Logo</label>
                      <ImageField
                        value={settings.navigationLogo}
                        onChange={(val) => updateSetting("navigationLogo", val)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Select an image from the file manager to use as the site logo
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
                Configure the footer displayed on the public site.
                Enable or disable it, set a logo and footer text.
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
                      onChange={(e) =>
                        updateSetting("footerEnabled", e.target.checked ? 1 : 0)
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
                        onChange={(e) =>
                          setSettings({ ...settings, footerText: e.target.value })
                        }
                        onBlur={() => handleSave({ footerText: settings.footerText })}
                        placeholder="Your company name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Text displayed in the footer alongside the copyright notice
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Footer Logo</label>
                      <ImageField
                        value={settings.footerLogo}
                        onChange={(val) => updateSetting("footerLogo", val)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Select an image from the file manager to use as the footer logo
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </Card>

          <Link href="/admin/settings/environment-sync" className="block">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
                  Environment Sync
                </CardTitle>
                <CardDescription>
                  Configure a target environment API to enable content
                  synchronization between environments.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </section>

        {saving && (
          <p className="text-xs text-muted-foreground">Saving...</p>
        )}
      </div>
    </PageLayout>
  );
}
