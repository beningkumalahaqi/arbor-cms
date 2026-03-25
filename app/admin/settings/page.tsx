import Link from "next/link";
import { PageLayout } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingItems = [
  {
    href: "/admin/settings/theme",
    title: "Theme",
    description: "Configure the admin and live site theme preferences.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg>
    ),
  },
  {
    href: "/admin/settings/quick-access",
    title: "Quick Access",
    description: "Choose dashboard modules and pin favorites.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
    ),
  },
  {
    href: "/admin/settings/navigation-footer",
    title: "Navigation and Footer",
    description: "Manage public site navigation and footer content.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></svg>
    ),
  },
  {
    href: "/admin/settings/environment-sync",
    title: "Environment Sync",
    description: "Configure target environment API and sync token.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Choose a settings area to configure."
    >
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {settingItems.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className="h-full cursor-pointer transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {item.icon}
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
