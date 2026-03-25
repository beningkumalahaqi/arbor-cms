"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, PageLayout } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardModuleDefinitions,
  parseDashboardModules,
  type DashboardModuleConfig,
  type DashboardModuleId,
} from "@/lib/admin/dashboard-modules";

export default function QuickAccessSettingsPage() {
  const [dashboardModules, setDashboardModules] = useState<DashboardModuleConfig[]>(
    parseDashboardModules("[]")
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        setDashboardModules(parseDashboardModules(data.settings?.dashboardModules));
        setLoaded(true);
      });
  }, []);

  async function persistModules(next: DashboardModuleConfig[]) {
    setSaving(true);
    try {
      await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardModules: JSON.stringify(next) }),
      });
    } finally {
      setSaving(false);
    }
  }

  function updateModules(next: DashboardModuleConfig[]) {
    setDashboardModules(next);
    void persistModules(next);
  }

  function toggleModule(id: DashboardModuleId) {
    const next = dashboardModules.map((module) =>
      module.id === id ? { ...module, enabled: !module.enabled } : module
    );
    updateModules(next);
  }

  function toggleFavorite(id: DashboardModuleId) {
    const next = dashboardModules.map((module) =>
      module.id === id ? { ...module, favorite: !module.favorite } : module
    );
    updateModules(next);
  }

  return (
    <PageLayout
      title="Quick Access Settings"
      description="Choose dashboard modules and pin favorites to prioritize them."
    >
      <div className="max-w-2xl space-y-6">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings">Back to Settings</Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Quick Access Modules</CardTitle>
            <CardDescription>
              Select which cards are shown on the dashboard. Use the star to pin favorites.
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
                        onClick={() => toggleFavorite(module.id)}
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
                          onChange={() => toggleModule(module.id)}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                        Show
                      </label>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Drag-and-drop card ordering is done directly from the dashboard.
              </p>
              {saving && <p className="text-xs text-muted-foreground">Saving...</p>}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
