"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  dashboardModuleDefinitions,
  type DashboardModuleConfig,
  type DashboardModuleId,
  sortDashboardModules,
} from "@/lib/admin/dashboard-modules";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardQuickAccessProps {
  initialModules: DashboardModuleConfig[];
}

const moduleIcons: Record<DashboardModuleId, ReactNode> = {
  pages: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  files: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
  ),
  "page-types": (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
  ),
  forms: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14l2 2 4-4" /></svg>
  ),
  "environment-sync": (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
  ),
};

const definitionsById = new Map(
  dashboardModuleDefinitions.map((definition) => [definition.id, definition])
);

function applyOrder(modules: DashboardModuleConfig[], orderedIds: DashboardModuleId[]) {
  const orderById = new Map<DashboardModuleId, number>(
    orderedIds.map((id, index) => [id, index])
  );

  return modules.map((module) => ({
    ...module,
    order: orderById.get(module.id) ?? module.order,
  }));
}

export function DashboardQuickAccess({ initialModules }: DashboardQuickAccessProps) {
  const [modules, setModules] = useState(initialModules);
  const [draggingId, setDraggingId] = useState<DashboardModuleId | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleModules = useMemo(
    () => sortDashboardModules(modules).filter((module) => module.enabled),
    [modules]
  );

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
    setModules(next);
    void persistModules(next);
  }

  function toggleFavorite(id: DashboardModuleId) {
    const next = modules.map((module) =>
      module.id === id ? { ...module, favorite: !module.favorite } : module
    );
    updateModules(next);
  }

  function reorderModules(fromId: DashboardModuleId, toId: DashboardModuleId) {
    if (fromId === toId) return;

    const orderedVisible = visibleModules.map((module) => module.id);
    const fromIndex = orderedVisible.indexOf(fromId);
    const toIndex = orderedVisible.indexOf(toId);

    if (fromIndex < 0 || toIndex < 0) return;

    const nextVisible = [...orderedVisible];
    const [moved] = nextVisible.splice(fromIndex, 1);
    nextVisible.splice(toIndex, 0, moved);

    const hiddenIds = sortDashboardModules(modules)
      .filter((module) => !module.enabled)
      .map((module) => module.id);

    const next = applyOrder(modules, [...nextVisible, ...hiddenIds]);
    updateModules(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
        <span className="text-xs text-muted-foreground">
          Drag cards to reorder. Favorites stay at the top.
        </span>
      </div>

      {visibleModules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No dashboard modules selected. Enable modules in Settings &gt; Quick Access.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleModules.map((module) => {
            const definition = definitionsById.get(module.id);
            if (!definition) return null;

            return (
              <div
                key={module.id}
                draggable
                onDragStart={() => setDraggingId(module.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!draggingId) return;
                  reorderModules(draggingId, module.id);
                  setDraggingId(null);
                }}
                onDragEnd={() => setDraggingId(null)}
                className="group"
              >
                <Card
                  className={
                    draggingId === module.id
                      ? "border-primary/70 bg-muted/40"
                      : "transition-colors group-hover:bg-muted/40"
                  }
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-foreground">
                        {moduleIcons[module.id]}
                        <CardTitle className="text-base">{definition.title}</CardTitle>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          toggleFavorite(module.id);
                        }}
                        className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={module.favorite ? "Remove favorite" : "Mark favorite"}
                        title={module.favorite ? "Pinned" : "Pin to top"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={module.favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </button>
                    </div>
                    <CardDescription>{definition.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between pt-0">
                    <Link
                      href={definition.href}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Open module
                    </Link>
                    <span className="text-xs text-muted-foreground">Drag</span>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {saving && <p className="text-xs text-muted-foreground">Saving dashboard layout...</p>}
    </div>
  );
}
