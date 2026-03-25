import { prisma } from "@/lib/db";
import { PageLayout } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { DashboardQuickAccess } from "@/components/admin/dashboard-quick-access";
import {
  createDefaultDashboardModules,
  parseDashboardModules,
} from "@/lib/admin/dashboard-modules";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    pageCount,
    publishedCount,
    draftCount,
    settings,
    recentPages,
  ] = await Promise.all([
    prisma.page.count(),
    prisma.page.count({ where: { status: "published" } }),
    prisma.page.count({ where: { status: "draft" } }),
    prisma.siteSettings.findFirst({
      select: { dashboardModules: true },
    }),
    prisma.page.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        pageType: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const dashboardModules = settings?.dashboardModules
    ? parseDashboardModules(settings.dashboardModules)
    : createDefaultDashboardModules();

  const recentActivity = recentPages.map((page) => {
    const isCreated = Math.abs(page.updatedAt.getTime() - page.createdAt.getTime()) < 1500;

    return {
      id: page.id,
      title: page.name.trim() || page.slug,
      type: isCreated ? "Created page" : "Updated page",
      pageType: page.pageType,
      timestamp: page.updatedAt.toLocaleString(),
    };
  });

  return (
    <PageLayout title="Dashboard" description="Overview of your CMS content.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {pageCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Published</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {publishedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">
              {draftCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardQuickAccess initialModules={dashboardModules} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest page updates across your content tree.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} . {item.pageType}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
