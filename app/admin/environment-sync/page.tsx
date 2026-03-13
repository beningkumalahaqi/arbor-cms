"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui";
import { Badge } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EnvironmentStatus {
  url: string;
  connected: boolean;
  label: string;
  error?: string;
}

interface SyncDetails {
  pages: number;
  widgets: number;
  pageTypeSettings: number;
  formTypes: number;
  formSubmissions: number;
  siteSettings: boolean;
  storageFiles: number;
  storageFolders: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  details?: SyncDetails;
}

function maskUrl(url: string): string {
  if (!url) return "Not configured";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (host.length > 8) {
      return `${parsed.protocol}//${host.slice(0, 4)}****${host.slice(-4)}`;
    }
    return `${parsed.protocol}//${host}`;
  } catch {
    if (url.startsWith("file:")) return url;
    if (url.length > 16) {
      return `${url.slice(0, 8)}****${url.slice(-4)}`;
    }
    return url;
  }
}

export default function EnvironmentSyncPage() {
  const [current, setCurrent] = useState<EnvironmentStatus | null>(null);
  const [target, setTarget] = useState<EnvironmentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"to" | "from" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/environment-sync/status");
        const data = await res.json();
        if (!cancelled) {
          setCurrent(data.current);
          setTarget(data.target);
        }
      } catch {
        // Status fetch failed
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/environment-sync/status");
      const data = await res.json();
      setCurrent(data.current);
      setTarget(data.target);
    } catch {
      // Status fetch failed
    }
    setLoading(false);
  }

  async function handleSync(direction: "to" | "from") {
    setConfirmDialog(null);
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/environment-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const result: SyncResult = await res.json();
      setSyncResult(result);
      await fetchStatus();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err instanceof Error
          ? `Sync failed: ${err.message}`
          : "An unexpected error occurred during sync.",
      });
    }
    setSyncing(false);
  }

  return (
    <PageLayout
      title="Environment Sync"
      description="Synchronize content between the current and target environment databases."
    >
      <div className="max-w-3xl space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current Environment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>
                Current Environment
              </CardTitle>
              <CardDescription>
                The database this CMS instance is connected to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : current ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={current.connected ? "default" : "destructive"}>
                      {current.connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Database URL:</span>
                    <p className="text-sm text-muted-foreground break-all">
                      {maskUrl(current.url)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to fetch status</p>
              )}
            </CardContent>
          </Card>

          {/* Target Environment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5V19A9 3 0 0 0 21 19V5" /><path d="M3 12A9 3 0 0 0 21 12" /></svg>
                Target Environment
              </CardTitle>
              <CardDescription>
                The remote database configured for synchronization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : target ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={target.connected ? "default" : "destructive"}>
                      {target.connected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Database URL:</span>
                    <p className="text-sm text-muted-foreground break-all">
                      {maskUrl(target.url)}
                    </p>
                  </div>
                  {target.error && (
                    <p className="text-sm text-destructive">{target.error}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to fetch status</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sync Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Actions</CardTitle>
            <CardDescription>
              Transfer CMS content between the current and target environments.
              This includes pages, widgets, form types, form submissions, storage files, and site settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setConfirmDialog("to")}
                disabled={syncing || !target?.connected}
              >
                {syncing ? "Syncing..." : "Sync to Target Environment"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog("from")}
                disabled={syncing || !target?.connected}
              >
                {syncing ? "Syncing..." : "Sync from Target Environment"}
              </Button>
            </div>
            {!target?.connected && !loading && (
              <p className="mt-3 text-sm text-muted-foreground">
                Configure a target environment in{" "}
                <Link
                  href="/admin/settings/environment-sync"
                  className="underline text-foreground"
                >
                  Settings
                </Link>{" "}
                to enable sync actions.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sync Result */}
        {syncResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sync Result
                <Badge variant={syncResult.success ? "default" : "destructive"}>
                  {syncResult.success ? "Success" : "Failed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{syncResult.message}</p>
              {syncResult.details && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Pages:</span>
                  <span>{syncResult.details.pages}</span>
                  <span className="text-muted-foreground">Widgets:</span>
                  <span>{syncResult.details.widgets}</span>
                  <span className="text-muted-foreground">Page Type Settings:</span>
                  <span>{syncResult.details.pageTypeSettings}</span>
                  <span className="text-muted-foreground">Form Types:</span>
                  <span>{syncResult.details.formTypes}</span>
                  <span className="text-muted-foreground">Form Submissions:</span>
                  <span>{syncResult.details.formSubmissions}</span>
                  <span className="text-muted-foreground">Site Settings:</span>
                  <span>{syncResult.details.siteSettings ? "Yes" : "No"}</span>
                  <span className="text-muted-foreground">Storage Files:</span>
                  <span>{syncResult.details.storageFiles}</span>
                  <span className="text-muted-foreground">Storage Folders:</span>
                  <span>{syncResult.details.storageFolders}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog === "to"
                ? "Sync to Target Environment"
                : "Sync from Target Environment"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog === "to"
                ? "This will copy all content from the current environment to the target environment. Existing content in the target will be overwritten."
                : "This will copy all content from the target environment to the current environment. Existing content in the current environment will be overwritten."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmDialog && handleSync(confirmDialog)}
            >
              Confirm Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
