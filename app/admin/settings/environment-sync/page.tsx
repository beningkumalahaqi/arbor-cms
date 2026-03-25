"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";

interface EnvironmentSyncSettings {
  environmentDatabaseUrl: string;
  environmentDatabaseToken: string;
  environmentSyncTokenConfigured: boolean;
}

export default function EnvironmentSyncSettingsPage() {
  const [settings, setSettings] = useState<EnvironmentSyncSettings>({
    environmentDatabaseUrl: "",
    environmentDatabaseToken: "",
    environmentSyncTokenConfigured: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [generatedToken, setGeneratedToken] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            environmentDatabaseUrl: data.settings.environmentDatabaseUrl || "",
            environmentDatabaseToken: data.settings.environmentDatabaseToken || "",
            environmentSyncTokenConfigured: Boolean(
              data.settings.environmentSyncTokenConfigured
            ),
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

  const handleGenerateToken = useCallback(async () => {
    setGeneratingToken(true);
    setSaved(false);
    try {
      const response = await fetch("/api/environment-sync/token", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate token.");
      }
      setGeneratedToken(data.token || "");
      setSettings((current) => ({
        ...current,
        environmentSyncTokenConfigured: true,
      }));
    } finally {
      setGeneratingToken(false);
    }
  }, []);

  return (
    <PageLayout
      title="Environment Sync Settings"
      description="Configure a target environment API to enable secure content synchronization between environments."
    >
      <div className="max-w-2xl space-y-6">
        <div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/settings">Back to Settings</Link>
          </Button>
        </div>
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
                  Bearer token sent to the target environment API. Copy the token from the target environment settings page and leave this blank to keep the existing value.
                </p>
              </div>

              <div className="space-y-2 rounded-md border p-4">
                <label className="text-sm font-medium text-foreground">
                  This Environment API Token
                </label>
                <p className="text-xs text-muted-foreground">
                  This token secures this environment&apos;s `/api/environment-sync/*` endpoints.
                </p>
                {settings.environmentSyncTokenConfigured ? (
                  <p className="text-xs text-muted-foreground">
                    Current token: ••••••••••••••••••••••••••••••••
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No token generated yet.
                  </p>
                )}
                {generatedToken && (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      readOnly
                      value={generatedToken}
                      aria-label="Generated environment sync token"
                    />
                    <p className="text-xs text-muted-foreground">
                      Copy this token now. For security, it is only shown immediately after generation.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant={settings.environmentSyncTokenConfigured ? "outline" : "default"}
                    onClick={handleGenerateToken}
                    disabled={generatingToken}
                  >
                    {generatingToken
                      ? "Generating..."
                      : settings.environmentSyncTokenConfigured
                        ? "Regenerate Token"
                        : "Generate Token"}
                  </Button>
                </div>
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
