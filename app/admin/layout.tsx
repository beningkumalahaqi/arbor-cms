import { redirect } from "next/navigation";
import { getSession, hasSuperAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const superAdminExists = await hasSuperAdmin();
  if (!superAdminExists) {
    redirect("/setup");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <AdminShell user={session}>{children}</AdminShell>;
}
