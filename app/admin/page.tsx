import { prisma } from "@/lib/db";
import { PageLayout } from "@/components/ui";
import { Card, CardTitle } from "@/components/ui";

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
          <CardTitle>Total Pages</CardTitle>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {pageCount}
          </p>
        </Card>
        <Card>
          <CardTitle>Published</CardTitle>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {publishedCount}
          </p>
        </Card>
        <Card>
          <CardTitle>Drafts</CardTitle>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {draftCount}
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
