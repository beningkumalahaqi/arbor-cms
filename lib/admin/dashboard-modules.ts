export type DashboardModuleId =
  | "pages"
  | "files"
  | "page-types"
  | "forms"
  | "environment-sync"
  | "settings";

export interface DashboardModuleDefinition {
  id: DashboardModuleId;
  title: string;
  href: string;
  description: string;
}

export interface DashboardModuleConfig {
  id: DashboardModuleId;
  enabled: boolean;
  favorite: boolean;
  order: number;
}

export const dashboardModuleDefinitions: DashboardModuleDefinition[] = [
  {
    id: "pages",
    title: "Pages",
    href: "/admin/pages",
    description: "Create, edit, and organize your page tree.",
  },
  {
    id: "files",
    title: "Media / Files",
    href: "/admin/files",
    description: "Upload and manage images and assets.",
  },
  {
    id: "page-types",
    title: "Page Types",
    href: "/admin/page-types",
    description: "Configure page type icons and child rules.",
  },
  {
    id: "forms",
    title: "Forms",
    href: "/admin/forms",
    description: "Review form submissions by form type.",
  },
  {
    id: "environment-sync",
    title: "Environment Sync",
    href: "/admin/environment-sync",
    description: "Sync content between environments.",
  },
  {
    id: "settings",
    title: "Settings",
    href: "/admin/settings",
    description: "Manage CMS preferences and configuration.",
  },
];

const moduleIds = new Set<DashboardModuleId>(
  dashboardModuleDefinitions.map((module) => module.id)
);

export function createDefaultDashboardModules(): DashboardModuleConfig[] {
  return dashboardModuleDefinitions.map((module, index) => ({
    id: module.id,
    enabled: true,
    favorite: false,
    order: index,
  }));
}

export function parseDashboardModules(raw?: string | null): DashboardModuleConfig[] {
  if (!raw) {
    return createDefaultDashboardModules();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DashboardModuleConfig>[];
    if (!Array.isArray(parsed)) {
      return createDefaultDashboardModules();
    }

    const byId = new Map<DashboardModuleId, DashboardModuleConfig>();

    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      if (typeof item.id !== "string") continue;
      if (!moduleIds.has(item.id as DashboardModuleId)) continue;

      const id = item.id as DashboardModuleId;
      byId.set(id, {
        id,
        enabled: Boolean(item.enabled),
        favorite: Boolean(item.favorite),
        order: typeof item.order === "number" ? item.order : Number.MAX_SAFE_INTEGER,
      });
    }

    return dashboardModuleDefinitions.map((module, index) => {
      const found = byId.get(module.id);
      if (found) {
        return found;
      }

      return {
        id: module.id,
        enabled: true,
        favorite: false,
        order: index,
      };
    });
  } catch {
    return createDefaultDashboardModules();
  }
}

export function sortDashboardModules(
  modules: DashboardModuleConfig[]
): DashboardModuleConfig[] {
  return [...modules].sort((a, b) => {
    if (a.favorite !== b.favorite) {
      return a.favorite ? -1 : 1;
    }

    return a.order - b.order;
  });
}
