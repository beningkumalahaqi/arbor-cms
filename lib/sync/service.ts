import { PrismaClient } from "@prisma/client";
import { environmentSyncClient } from "@/lib/environment-sync/sync.client";

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

export interface SyncPayload {
  siteSettings: {
    id: string;
    navigationEnabled: number;
    navigationLogo: string;
    navigationTitle: string;
    footerEnabled: number;
    footerLogo: string;
    footerText: string;
  } | null;
  pageTypeSettings: Array<{
    id: string;
    pageTypeName: string;
    icon: string;
    allowedChildren: string;
  }>;
  pages: Array<{
    id: string;
    parentId: string | null;
    slug: string;
    fullPath: string;
    name: string;
    pageType: string;
    status: string;
    content: string;
    sortOrder: number;
    showInNav: number;
    navLabel: string;
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
  }>;
  widgets: Array<{
    id: string;
    pageId: string;
    area: string;
    type: string;
    props: string;
    sortOrder: number;
    parentId: string | null;
    slot: string;
  }>;
  formTypes: Array<{
    id: string;
    name: string;
    elements: string;
  }>;
  formSubmissions: Array<{
    id: string;
    widgetId: string;
    formTypeId: string;
    formName: string;
    pageId: string;
    data: string;
    createdAt: string;
  }>;
  storageFolders: Array<{
    id: string;
    path: string;
  }>;
  storageFiles: Array<{
    id: string;
    name: string;
    path: string;
    mimeType: string;
    size: number;
    dataBase64: string;
  }>;
}

function detailsFromPayload(payload: SyncPayload) {
  return {
    pages: payload.pages.length,
    widgets: payload.widgets.length,
    pageTypeSettings: payload.pageTypeSettings.length,
    formTypes: payload.formTypes.length,
    formSubmissions: payload.formSubmissions.length,
    siteSettings: Boolean(payload.siteSettings),
    storageFiles: payload.storageFiles.length,
    storageFolders: payload.storageFolders.length,
  };
}

async function buildSyncPayload(source: PrismaClient): Promise<SyncPayload> {
  const siteSettings = await source.siteSettings.findFirst();
  const pageTypeSettings = await source.pageTypeSettings.findMany();
  const pages = await source.page.findMany({ orderBy: { fullPath: "asc" } });
  const allWidgets = await source.widget.findMany({ orderBy: { sortOrder: "asc" } });
  const formTypes = await source.formType.findMany();
  const formSubmissions = await source.formSubmission.findMany();
  const storageFolders = await source.storageFolder.findMany();
  const storageFiles = await source.storageFile.findMany();

  const parentWidgets = allWidgets.filter((widget) => !widget.parentId);
  const childWidgets = allWidgets.filter((widget) => widget.parentId);

  return {
    siteSettings: siteSettings
      ? {
          id: siteSettings.id,
          navigationEnabled: siteSettings.navigationEnabled,
          navigationLogo: siteSettings.navigationLogo,
          navigationTitle: siteSettings.navigationTitle,
          footerEnabled: siteSettings.footerEnabled,
          footerLogo: siteSettings.footerLogo,
          footerText: siteSettings.footerText,
        }
      : null,
    pageTypeSettings: pageTypeSettings.map((item) => ({
      id: item.id,
      pageTypeName: item.pageTypeName,
      icon: item.icon,
      allowedChildren: item.allowedChildren,
    })),
    pages: pages.map((page) => ({
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
    })),
    widgets: [...parentWidgets, ...childWidgets].map((widget) => ({
      id: widget.id,
      pageId: widget.pageId,
      area: widget.area,
      type: widget.type,
      props: widget.props,
      sortOrder: widget.sortOrder,
      parentId: widget.parentId,
      slot: widget.slot,
    })),
    formTypes: formTypes.map((item) => ({
      id: item.id,
      name: item.name,
      elements: item.elements,
    })),
    formSubmissions: formSubmissions.map((item) => ({
      id: item.id,
      widgetId: item.widgetId,
      formTypeId: item.formTypeId,
      formName: item.formName,
      pageId: item.pageId,
      data: item.data,
      createdAt: item.createdAt.toISOString(),
    })),
    storageFolders: storageFolders.map((folder) => ({
      id: folder.id,
      path: folder.path,
    })),
    storageFiles: storageFiles.map((file) => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mimeType,
      size: file.size,
      dataBase64: Buffer.from(file.data).toString("base64"),
    })),
  };
}

async function applySyncPayload(target: PrismaClient, payload: SyncPayload): Promise<void> {
  if (payload.siteSettings) {
    const existing = await target.siteSettings.findFirst();
    const data = {
      navigationEnabled: payload.siteSettings.navigationEnabled,
      navigationLogo: payload.siteSettings.navigationLogo,
      navigationTitle: payload.siteSettings.navigationTitle,
      footerEnabled: payload.siteSettings.footerEnabled,
      footerLogo: payload.siteSettings.footerLogo,
      footerText: payload.siteSettings.footerText,
    };

    if (existing) {
      await target.siteSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await target.siteSettings.create({
        data: { id: payload.siteSettings.id, ...data },
      });
    }
  }

  for (const item of payload.pageTypeSettings) {
    const data = {
      pageTypeName: item.pageTypeName,
      icon: item.icon,
      allowedChildren: item.allowedChildren,
    };

    const existingById = await target.pageTypeSettings.findUnique({ where: { id: item.id } });
    if (existingById) {
      await target.pageTypeSettings.update({ where: { id: item.id }, data });
      continue;
    }

    const existingByName = await target.pageTypeSettings.findUnique({ where: { pageTypeName: item.pageTypeName } });
    if (existingByName) {
      await target.pageTypeSettings.update({ where: { pageTypeName: item.pageTypeName }, data });
      continue;
    }

    await target.pageTypeSettings.create({ data: { id: item.id, ...data } });
  }

  for (const page of payload.pages) {
    const data = {
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
      await target.page.update({ where: { id: page.id }, data });
      continue;
    }

    const existingByPath = await target.page.findUnique({ where: { fullPath: page.fullPath } });
    if (existingByPath) {
      await target.page.update({ where: { fullPath: page.fullPath }, data });
      continue;
    }

    await target.page.create({ data: { id: page.id, ...data } });
  }

  for (const widget of payload.widgets) {
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

  for (const formType of payload.formTypes) {
    await target.formType.upsert({
      where: { id: formType.id },
      create: {
        id: formType.id,
        name: formType.name,
        elements: formType.elements,
      },
      update: {
        name: formType.name,
        elements: formType.elements,
      },
    });
  }

  for (const submission of payload.formSubmissions) {
    try {
      await target.formSubmission.upsert({
        where: { id: submission.id },
        create: {
          id: submission.id,
          widgetId: submission.widgetId,
          formTypeId: submission.formTypeId,
          formName: submission.formName,
          pageId: submission.pageId,
          data: submission.data,
          createdAt: new Date(submission.createdAt),
        },
        update: {
          widgetId: submission.widgetId,
          formTypeId: submission.formTypeId,
          formName: submission.formName,
          pageId: submission.pageId,
          data: submission.data,
        },
      });
    } catch (error) {
      console.error("Skipping form submission sync:", error instanceof Error ? error.message : error);
    }
  }

  for (const folder of payload.storageFolders) {
    const existingById = await target.storageFolder.findUnique({ where: { id: folder.id } });
    if (existingById) {
      await target.storageFolder.update({ where: { id: folder.id }, data: { path: folder.path } });
      continue;
    }

    const existingByPath = await target.storageFolder.findUnique({ where: { path: folder.path } });
    if (!existingByPath) {
      await target.storageFolder.create({ data: { id: folder.id, path: folder.path } });
    }
  }

  for (const file of payload.storageFiles) {
    const data = {
      name: file.name,
      path: file.path,
      mimeType: file.mimeType,
      size: file.size,
      data: Buffer.from(file.dataBase64, "base64"),
    };

    const existingById = await target.storageFile.findUnique({ where: { id: file.id } });
    if (existingById) {
      await target.storageFile.update({ where: { id: file.id }, data });
      continue;
    }

    const existingByPath = await target.storageFile.findUnique({ where: { path: file.path } });
    if (existingByPath) {
      await target.storageFile.update({ where: { path: file.path }, data });
      continue;
    }

    await target.storageFile.create({ data: { id: file.id, ...data } });
  }
}

async function testConnection(
  targetApiUrl: string,
  targetApiToken?: string
): Promise<{ connected: boolean; error?: string }> {
  return environmentSyncClient.getStatus(targetApiUrl, targetApiToken);
}

async function syncToTarget(
  source: PrismaClient,
  targetApiUrl: string,
  targetApiToken?: string
): Promise<SyncResult> {
  try {
    const payload = await buildSyncPayload(source);
    const response = await environmentSyncClient.push(targetApiUrl, targetApiToken, { payload });

    if (!response.success) {
      return {
        success: false,
        message: response.error || response.message || "Sync failed while pushing to target environment.",
      };
    }

    return {
      success: true,
      message: response.message || "Sync to target environment completed successfully.",
      details: detailsFromPayload(payload),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Sync failed: ${message}` };
  }
}

async function syncFromTarget(
  source: PrismaClient,
  targetApiUrl: string,
  targetApiToken?: string
): Promise<SyncResult> {
  try {
    const response = await environmentSyncClient.pull<SyncPayload>(targetApiUrl, targetApiToken);
    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.error || response.message || "Sync failed while pulling from target environment.",
      };
    }

    await applySyncPayload(source, response.data);

    return {
      success: true,
      message: response.message || "Sync from target environment completed successfully.",
      details: detailsFromPayload(response.data),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Sync failed: ${message}` };
  }
}

export const syncService = {
  testConnection,
  syncToTarget,
  syncFromTarget,
  buildSyncPayload,
  applySyncPayload,
};
