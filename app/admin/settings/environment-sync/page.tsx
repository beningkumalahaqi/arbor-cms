"use client";

import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";

interface EnvironmentSyncSettings {
  environmentDatabaseUrl: string;
  environmentDatabaseToken: string;
}

export default function EnvironmentSyncSettingsPage() {
  const [settings, setSettings] = useState<EnvironmentSyncSettings>({
    environmentDatabaseUrl: "",
    environmentDatabaseToken: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            environmentDatabaseUrl: data.settings.environmentDatabaseUrl || "",
            environmentDatabaseToken: data.settings.environmentDatabaseToken || "",
          });
        }
        setLoaded(true);
      });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        environmentDatabaseUrl: settings.environmentDatabaseUrl,
        environmentDatabaseToken: settings.environmentDatabaseToken,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [settings]);

  return (
    <PageLayout
      title="Environment Sync Settings"
      description="Configure a target environment database to enable content synchronization between environments."
    >
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Target Environment Database</CardTitle>
            <CardDescription>
              Provide the database connection details for the target environment.
              This is the database that content will be synced to or from.
            </CardDescription>
          </CardHeader>
          {loaded && (
            <div className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Environment Database URL
                </label>
                <Input
                  type="text"
                  value={settings.environmentDatabaseUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      environmentDatabaseUrl: e.target.value,
                    })
                  }
                  placeholder="libsql://your-database-url.turso.io"
                />
                <p className="text-xs text-muted-foreground">
                  The URL of the target environment database (e.g., a LibSQL or Turso URL)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Environment Database Token
                </label>
                <Input
                  type="password"
                  value={settings.environmentDatabaseToken}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      environmentDatabaseToken: e.target.value,
                    })
                  }
                  placeholder="Enter database authentication token"
                />
                <p className="text-xs text-muted-foreground">
                  The authentication token for the target database (leave empty if not required)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                {saved && (
                  <span className="text-sm text-muted-foreground">
                    Settings saved successfully.
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
