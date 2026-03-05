import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageLayout } from "@/components/ui";
import { Button } from "@/components/ui";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

export default async function PagesListPage() {
  const pages = await prisma.page.findMany({
    orderBy: [{ fullPath: "asc" }],
  });

  return (
    <PageLayout
      title="Pages"
      description="Manage your page tree."
      actions={
        <Link href="/admin/pages/new">
          <Button>New Page</Button>
        </Link>
      }
    >
      {pages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">
            No pages yet. Create your first page to get started.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Path</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <span className="font-mono text-sm">{page.fullPath}</span>
                </TableCell>
                <TableCell>{page.slug}</TableCell>
                <TableCell>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {page.pageType}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      page.status === "published"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {page.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/pages/${page.id}`}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </PageLayout>
  );
}
