import { prisma } from "@/lib/db";
import { PageLayout } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const pageCount = await prisma.page.count();
  const publishedCount = await prisma.page.count({
    where: { status: "published" },
  });
  const draftCount = await prisma.page.count({
    where: { status: "draft" },
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
    </PageLayout>
  );
}
