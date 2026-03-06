"use client";

import { useTheme, type Theme } from "@/components/theme-provider";
import { PageLayout } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const themeOptions: { value: Theme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function ThemeSelector({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (t: Theme) => void;
}) {
  return (
    <div className="flex gap-2 rounded-lg border bg-muted/50 p-1">
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { adminTheme, siteTheme, setAdminTheme, setSiteTheme } = useTheme();

  return (
    <PageLayout
      title="Settings"
      description="Manage your CMS preferences and configuration."
    >
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Control the appearance of the admin interface and the public site independently.
              Auto will match your operating system setting.
            </CardDescription>
          </CardHeader>
          <div className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CMS Admin</label>
              <ThemeSelector value={adminTheme} onChange={setAdminTheme} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Live Site</label>
              <ThemeSelector value={siteTheme} onChange={setSiteTheme} />
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
