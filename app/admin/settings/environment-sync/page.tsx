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
    const payload: Record<string, string> = {
      environmentDatabaseUrl: settings.environmentDatabaseUrl,
    };
    if (settings.environmentDatabaseToken.trim()) {
      payload.environmentDatabaseToken = settings.environmentDatabaseToken;
    }

    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [settings]);

  return (
    <PageLayout
      title="Environment Sync Settings"
      description="Configure a target environment API to enable secure content synchronization between environments."
    >
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Target Environment API</CardTitle>
            <CardDescription>
              Provide the API connection details for the target environment.
              This API receives push sync requests and serves pull sync data.
            </CardDescription>
          </CardHeader>
          {loaded && (
            <div className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Target Environment API URL
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
                  placeholder="https://target.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The base URL of the target Arbor CMS environment (must include http:// or https://)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Target Environment API Token
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
                  placeholder="Enter target environment sync token"
                />
                <p className="text-xs text-muted-foreground">
                  Bearer token sent to the target environment API (must match ENV_SYNC_TOKEN on the target). Leave blank to keep existing token.
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
