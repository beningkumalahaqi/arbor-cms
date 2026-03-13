import { prisma } from "@/lib/db";

/**
 * Recursively update fullPath for all descendant pages when a page's path changes.
 * Updates are performed sequentially to avoid constraint violations on the unique
 * fullPath index.
 */
export async function updateDescendantPaths(
  pageId: string,
  oldBasePath: string,
  newBasePath: string
): Promise<void> {
  const children = await prisma.page.findMany({ where: { parentId: pageId } });
  for (const child of children) {
    const newChildPath = child.fullPath.replace(oldBasePath, newBasePath);
    await prisma.page.update({
      where: { id: child.id },
      data: { fullPath: newChildPath },
    });
    await updateDescendantPaths(child.id, child.fullPath, newChildPath);
  }
}
