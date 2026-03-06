"use client";

import { SiteNavigation } from "./site-navigation";
import { SiteFooter } from "./site-footer";

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface SiteLayoutProps {
  navigation: {
    enabled: boolean;
    logo: string;
    title: string;
    items: NavItem[];
  } | null;
  footer: {
    enabled: boolean;
    logo: string;
    text: string;
  } | null;
  currentPath: string;
  children: React.ReactNode;
}

export function SiteLayout({ navigation, footer, currentPath, children }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {navigation?.enabled && (
        <SiteNavigation
          logo={navigation.logo}
          title={navigation.title}
          items={navigation.items}
          currentPath={currentPath}
        />
      )}
      <main className="flex-1">{children}</main>
      {footer?.enabled && (
        <SiteFooter logo={footer.logo} text={footer.text} />
      )}
    </div>
  );
}
