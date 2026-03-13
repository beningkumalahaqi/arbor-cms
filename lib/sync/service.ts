import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

export interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    pages: number;
    widgets: number;
    pageTypeSettings: number;
    formTypes: number;
    formSubmissions: number;
    siteSettings: boolean;
    storageFiles: number;
    storageFolders: number;
  };
}

function validateUrl(url: string): void {
  if (!url || typeof url !== "string") {
    throw new Error("Database URL is required");
  }
  const allowed = url.startsWith("libsql://") || url.startsWith("file:") || url.startsWith("https://");
  if (!allowed) {
    throw new Error("Database URL must start with libsql://, https://, or file:");
  }
}

function createTargetClient(url: string, authToken?: string): PrismaClient {
  validateUrl(url);
  const adapter = new PrismaLibSql({
    url,
    authToken: authToken || undefined,
  });
  return new PrismaClient({ adapter });
}

async function testConnection(
  url: string,
  authToken?: string
): Promise<{ connected: boolean; error?: string }> {
  let client: PrismaClient | null = null;
  try {
    client = createTargetClient(url, authToken);
    await client.siteSettings.findFirst();
    return { connected: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { connected: false, error: message };
  } finally {
    if (client) {
      await client.$disconnect();
    }
  }
}

async function syncToTarget(
  source: PrismaClient,
  targetUrl: string,
  targetToken?: string
): Promise<SyncResult> {
  let target: PrismaClient | null = null;
  try {
    target = createTargetClient(targetUrl, targetToken);

    // 1. Sync SiteSettings (exclude environment sync fields)
    const siteSettings = await source.siteSettings.findFirst();
    let siteSettingsSynced = false;
    if (siteSettings) {
      const existing = await target.siteSettings.findFirst();
      const data = {
        navigationEnabled: siteSettings.navigationEnabled,
        navigationLogo: siteSettings.navigationLogo,
        navigationTitle: siteSettings.navigationTitle,
        footerEnabled: siteSettings.footerEnabled,
        footerLogo: siteSettings.footerLogo,
        footerText: siteSettings.footerText,
      };
      if (existing) {
        await target.siteSettings.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await target.siteSettings.create({
          data: { id: siteSettings.id, ...data },
        });
      }
      siteSettingsSynced = true;
    }

    // 2. Sync PageTypeSettings
    const pageTypeSettings = await source.pageTypeSettings.findMany();
    for (const pts of pageTypeSettings) {
      const ptsData = { pageTypeName: pts.pageTypeName, icon: pts.icon, allowedChildren: pts.allowedChildren };
      const existingById = await target.pageTypeSettings.findUnique({ where: { id: pts.id } });
      if (existingById) {
        await target.pageTypeSettings.update({ where: { id: pts.id }, data: ptsData });
      } else {
        const existingByName = await target.pageTypeSettings.findUnique({ where: { pageTypeName: pts.pageTypeName } });
        if (existingByName) {
          await target.pageTypeSettings.update({ where: { pageTypeName: pts.pageTypeName }, data: ptsData });
        } else {
          await target.pageTypeSettings.create({ data: { id: pts.id, ...ptsData } });
        }
      }
    }

    // 3. Sync Pages (parent pages first, then children)
    const allPages = await source.page.findMany({
      orderBy: { fullPath: "asc" },
    });
    for (const page of allPages) {
      const pageData = {
        parentId: page.parentId,
        slug: page.slug,
        fullPath: page.fullPath,
        name: page.name,
        pageType: page.pageType,
        status: page.status,
        content: page.content,
        sortOrder: page.sortOrder,
        showInNav: page.showInNav,
        navLabel: page.navLabel,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        ogTitle: page.ogTitle,
        ogDescription: page.ogDescription,
        ogImage: page.ogImage,
      };
      const existingById = await target.page.findUnique({ where: { id: page.id } });
      if (existingById) {
        await target.page.update({ where: { id: page.id }, data: pageData });
      } else {
        const existingByPath = await target.page.findUnique({ where: { fullPath: page.fullPath } });
        if (existingByPath) {
          await target.page.update({ where: { fullPath: page.fullPath }, data: pageData });
        } else {
          await target.page.create({ data: { id: page.id, ...pageData } });
        }
      }
    }

    // 4. Sync Widgets (parent widgets first, then children)
    const allWidgets = await source.widget.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const parentWidgets = allWidgets.filter((w) => !w.parentId);
    const childWidgets = allWidgets.filter((w) => w.parentId);

    for (const widget of [...parentWidgets, ...childWidgets]) {
      await target.widget.upsert({
        where: { id: widget.id },
        create: {
          id: widget.id,
          pageId: widget.pageId,
          area: widget.area,
          type: widget.type,
          props: widget.props,
          sortOrder: widget.sortOrder,
          parentId: widget.parentId,
          slot: widget.slot,
        },
        update: {
          pageId: widget.pageId,
          area: widget.area,
          type: widget.type,
          props: widget.props,
          sortOrder: widget.sortOrder,
          parentId: widget.parentId,
          slot: widget.slot,
        },
      });
    }

    // 5. Sync FormTypes
    const formTypes = await source.formType.findMany();
    for (const ft of formTypes) {
      await target.formType.upsert({
        where: { id: ft.id },
        create: {
          id: ft.id,
          name: ft.name,
          elements: ft.elements,
        },
        update: {
          name: ft.name,
          elements: ft.elements,
        },
      });
    }

    // 6. Sync FormSubmissions
    const formSubmissions = await source.formSubmission.findMany();
    for (const fs of formSubmissions) {
      try {
        await target.formSubmission.upsert({
          where: { id: fs.id },
          create: {
            id: fs.id,
            widgetId: fs.widgetId,
            formTypeId: fs.formTypeId,
            formName: fs.formName,
            pageId: fs.pageId,
            data: fs.data,
            createdAt: fs.createdAt,
          },
          update: {
            widgetId: fs.widgetId,
            formTypeId: fs.formTypeId,
            formName: fs.formName,
            pageId: fs.pageId,
            data: fs.data,
          },
        });
      } catch (err) {
        // Log but skip submissions that fail (e.g., referential integrity)
        console.error("Skipping form submission sync:", (err instanceof Error ? err.message : err));
      }
    }

    // 7. Sync StorageFolders
    const storageFolders = await source.storageFolder.findMany();
    for (const folder of storageFolders) {
      const existingById = await target.storageFolder.findUnique({ where: { id: folder.id } });
      if (existingById) {
        await target.storageFolder.update({ where: { id: folder.id }, data: { path: folder.path } });
      } else {
        const existingByPath = await target.storageFolder.findUnique({ where: { path: folder.path } });
        if (!existingByPath) {
          await target.storageFolder.create({ data: { id: folder.id, path: folder.path } });
        }
      }
    }

    // 8. Sync StorageFiles
    const storageFiles = await source.storageFile.findMany();
    for (const file of storageFiles) {
      const fileData = { name: file.name, path: file.path, mimeType: file.mimeType, size: file.size, data: file.data };
      const existingById = await target.storageFile.findUnique({ where: { id: file.id } });
      if (existingById) {
        await target.storageFile.update({ where: { id: file.id }, data: fileData });
      } else {
        const existingByPath = await target.storageFile.findUnique({ where: { path: file.path } });
        if (existingByPath) {
          await target.storageFile.update({ where: { path: file.path }, data: fileData });
        } else {
          await target.storageFile.create({ data: { id: file.id, ...fileData } });
        }
      }
    }

    return {
      success: true,
      message: "Sync to target environment completed successfully.",
      details: {
        pages: allPages.length,
        widgets: allWidgets.length,
        pageTypeSettings: pageTypeSettings.length,
        formTypes: formTypes.length,
        formSubmissions: formSubmissions.length,
        siteSettings: siteSettingsSynced,
        storageFiles: storageFiles.length,
        storageFolders: storageFolders.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Sync failed: ${message}` };
  } finally {
    if (target) {
      await target.$disconnect();
    }
  }
}

async function syncFromTarget(
  source: PrismaClient,
  targetUrl: string,
  targetToken?: string
): Promise<SyncResult> {
  let target: PrismaClient | null = null;
  try {
    target = createTargetClient(targetUrl, targetToken);

    // 1. Sync SiteSettings from target (exclude environment sync fields)
    const remoteSiteSettings = await target.siteSettings.findFirst();
    let siteSettingsSynced = false;
    if (remoteSiteSettings) {
      const existing = await source.siteSettings.findFirst();
      const data = {
        navigationEnabled: remoteSiteSettings.navigationEnabled,
        navigationLogo: remoteSiteSettings.navigationLogo,
        navigationTitle: remoteSiteSettings.navigationTitle,
        footerEnabled: remoteSiteSettings.footerEnabled,
        footerLogo: remoteSiteSettings.footerLogo,
        footerText: remoteSiteSettings.footerText,
      };
      if (existing) {
        await source.siteSettings.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await source.siteSettings.create({
          data: { id: remoteSiteSettings.id, ...data },
        });
      }
      siteSettingsSynced = true;
    }

    // 2. Sync PageTypeSettings
    const pageTypeSettings = await target.pageTypeSettings.findMany();
    for (const pts of pageTypeSettings) {
      const ptsData = { pageTypeName: pts.pageTypeName, icon: pts.icon, allowedChildren: pts.allowedChildren };
      const existingById = await source.pageTypeSettings.findUnique({ where: { id: pts.id } });
      if (existingById) {
        await source.pageTypeSettings.update({ where: { id: pts.id }, data: ptsData });
      } else {
        const existingByName = await source.pageTypeSettings.findUnique({ where: { pageTypeName: pts.pageTypeName } });
        if (existingByName) {
          await source.pageTypeSettings.update({ where: { pageTypeName: pts.pageTypeName }, data: ptsData });
        } else {
          await source.pageTypeSettings.create({ data: { id: pts.id, ...ptsData } });
        }
      }
    }

    // 3. Sync Pages (parent pages first, then children)
    const allPages = await target.page.findMany({
      orderBy: { fullPath: "asc" },
    });
    for (const page of allPages) {
      const pageData = {
        parentId: page.parentId,
        slug: page.slug,
        fullPath: page.fullPath,
        name: page.name,
        pageType: page.pageType,
        status: page.status,
        content: page.content,
        sortOrder: page.sortOrder,
        showInNav: page.showInNav,
        navLabel: page.navLabel,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        canonicalUrl: page.canonicalUrl,
        ogTitle: page.ogTitle,
        ogDescription: page.ogDescription,
        ogImage: page.ogImage,
      };
      const existingById = await source.page.findUnique({ where: { id: page.id } });
      if (existingById) {
        await source.page.update({ where: { id: page.id }, data: pageData });
      } else {
        const existingByPath = await source.page.findUnique({ where: { fullPath: page.fullPath } });
        if (existingByPath) {
          await source.page.update({ where: { fullPath: page.fullPath }, data: pageData });
        } else {
          await source.page.create({ data: { id: page.id, ...pageData } });
        }
      }
    }

    // 4. Sync Widgets (parent widgets first, then children)
    const allWidgets = await target.widget.findMany({
      orderBy: { sortOrder: "asc" },
    });
    const parentWidgets = allWidgets.filter((w) => !w.parentId);
    const childWidgets = allWidgets.filter((w) => w.parentId);

    for (const widget of [...parentWidgets, ...childWidgets]) {
      await source.widget.upsert({
        where: { id: widget.id },
        create: {
          id: widget.id,
          pageId: widget.pageId,
          area: widget.area,
          type: widget.type,
          props: widget.props,
          sortOrder: widget.sortOrder,
          parentId: widget.parentId,
          slot: widget.slot,
        },
        update: {
          pageId: widget.pageId,
          area: widget.area,
          type: widget.type,
          props: widget.props,
          sortOrder: widget.sortOrder,
          parentId: widget.parentId,
          slot: widget.slot,
        },
      });
    }

    // 5. Sync FormTypes
    const formTypes = await target.formType.findMany();
    for (const ft of formTypes) {
      await source.formType.upsert({
        where: { id: ft.id },
        create: {
          id: ft.id,
          name: ft.name,
          elements: ft.elements,
        },
        update: {
          name: ft.name,
          elements: ft.elements,
        },
      });
    }

    // 6. Sync FormSubmissions
    const formSubmissions = await target.formSubmission.findMany();
    for (const submission of formSubmissions) {
      try {
        await source.formSubmission.upsert({
          where: { id: submission.id },
          create: {
            id: submission.id,
            widgetId: submission.widgetId,
            formTypeId: submission.formTypeId,
            formName: submission.formName,
            pageId: submission.pageId,
            data: submission.data,
            createdAt: submission.createdAt,
          },
          update: {
            widgetId: submission.widgetId,
            formTypeId: submission.formTypeId,
            formName: submission.formName,
            pageId: submission.pageId,
            data: submission.data,
          },
        });
      } catch (err) {
        // Log but skip submissions that fail (e.g., referential integrity)
        console.error("Skipping form submission sync:", (err instanceof Error ? err.message : err));
      }
    }

    // 7. Sync StorageFolders
    const storageFolders = await target.storageFolder.findMany();
    for (const folder of storageFolders) {
      const existingById = await source.storageFolder.findUnique({ where: { id: folder.id } });
      if (existingById) {
        await source.storageFolder.update({ where: { id: folder.id }, data: { path: folder.path } });
      } else {
        const existingByPath = await source.storageFolder.findUnique({ where: { path: folder.path } });
        if (!existingByPath) {
          await source.storageFolder.create({ data: { id: folder.id, path: folder.path } });
        }
      }
    }

    // 8. Sync StorageFiles
    const storageFiles = await target.storageFile.findMany();
    for (const file of storageFiles) {
      const fileData = { name: file.name, path: file.path, mimeType: file.mimeType, size: file.size, data: file.data };
      const existingById = await source.storageFile.findUnique({ where: { id: file.id } });
      if (existingById) {
        await source.storageFile.update({ where: { id: file.id }, data: fileData });
      } else {
        const existingByPath = await source.storageFile.findUnique({ where: { path: file.path } });
        if (existingByPath) {
          await source.storageFile.update({ where: { path: file.path }, data: fileData });
        } else {
          await source.storageFile.create({ data: { id: file.id, ...fileData } });
        }
      }
    }

    return {
      success: true,
      message: "Sync from target environment completed successfully.",
      details: {
        pages: allPages.length,
        widgets: allWidgets.length,
        pageTypeSettings: pageTypeSettings.length,
        formTypes: formTypes.length,
        formSubmissions: formSubmissions.length,
        siteSettings: siteSettingsSynced,
        storageFiles: storageFiles.length,
        storageFolders: storageFolders.length,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Sync failed: ${message}` };
  } finally {
    if (target) {
      await target.$disconnect();
    }
  }
}

export const syncService = {
  testConnection,
  syncToTarget,
  syncFromTarget,
};
