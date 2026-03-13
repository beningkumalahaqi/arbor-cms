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

function createTargetClient(url: string, authToken?: string): PrismaClient {
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
      await target.pageTypeSettings.upsert({
        where: { id: pts.id },
        create: {
          id: pts.id,
          pageTypeName: pts.pageTypeName,
          icon: pts.icon,
          allowedChildren: pts.allowedChildren,
        },
        update: {
          pageTypeName: pts.pageTypeName,
          icon: pts.icon,
          allowedChildren: pts.allowedChildren,
        },
      });
    }

    // 3. Sync Pages (parent pages first, then children)
    const allPages = await source.page.findMany({
      orderBy: { fullPath: "asc" },
    });
    for (const page of allPages) {
      await target.page.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
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
        },
        update: {
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
        },
      });
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
      } catch {
        // Skip submissions that fail due to referential integrity
      }
    }

    // 7. Sync StorageFolders
    const storageFolders = await source.storageFolder.findMany();
    for (const folder of storageFolders) {
      await target.storageFolder.upsert({
        where: { id: folder.id },
        create: {
          id: folder.id,
          path: folder.path,
        },
        update: {
          path: folder.path,
        },
      });
    }

    // 8. Sync StorageFiles
    const storageFiles = await source.storageFile.findMany();
    for (const file of storageFiles) {
      await target.storageFile.upsert({
        where: { id: file.id },
        create: {
          id: file.id,
          name: file.name,
          path: file.path,
          mimeType: file.mimeType,
          size: file.size,
          data: file.data,
        },
        update: {
          name: file.name,
          path: file.path,
          mimeType: file.mimeType,
          size: file.size,
          data: file.data,
        },
      });
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
      await source.pageTypeSettings.upsert({
        where: { id: pts.id },
        create: {
          id: pts.id,
          pageTypeName: pts.pageTypeName,
          icon: pts.icon,
          allowedChildren: pts.allowedChildren,
        },
        update: {
          pageTypeName: pts.pageTypeName,
          icon: pts.icon,
          allowedChildren: pts.allowedChildren,
        },
      });
    }

    // 3. Sync Pages (parent pages first, then children)
    const allPages = await target.page.findMany({
      orderBy: { fullPath: "asc" },
    });
    for (const page of allPages) {
      await source.page.upsert({
        where: { id: page.id },
        create: {
          id: page.id,
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
        },
        update: {
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
        },
      });
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
      } catch {
        // Skip submissions that fail due to referential integrity
      }
    }

    // 7. Sync StorageFolders
    const storageFolders = await target.storageFolder.findMany();
    for (const folder of storageFolders) {
      await source.storageFolder.upsert({
        where: { id: folder.id },
        create: {
          id: folder.id,
          path: folder.path,
        },
        update: {
          path: folder.path,
        },
      });
    }

    // 8. Sync StorageFiles
    const storageFiles = await target.storageFile.findMany();
    for (const file of storageFiles) {
      await source.storageFile.upsert({
        where: { id: file.id },
        create: {
          id: file.id,
          name: file.name,
          path: file.path,
          mimeType: file.mimeType,
          size: file.size,
          data: file.data,
        },
        update: {
          name: file.name,
          path: file.path,
          mimeType: file.mimeType,
          size: file.size,
          data: file.data,
        },
      });
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
