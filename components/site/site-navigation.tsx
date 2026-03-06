"use client";

import { useState } from "react";
import Link from "next/link";

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface SiteNavigationProps {
  logo: string;
  title: string;
  items: NavItem[];
  currentPath: string;
}

export function SiteNavigation({ logo, title, items, currentPath }: SiteNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Title */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {logo && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`/api/storage/file/${logo}`}
              alt={title || "Site logo"}
              className="h-8 w-8 rounded object-contain"
            />
          )}
          {title && (
            <span className="text-lg font-semibold text-foreground">
              {title}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentPath === item.path
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile side panel */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Side panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 border-l bg-background shadow-lg md:hidden">
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                {logo && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/storage/file/${logo}`}
                    alt={title || "Site logo"}
                    className="h-7 w-7 rounded object-contain"
                  />
                )}
                {title && (
                  <span className="text-base font-semibold text-foreground">{title}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-label="Close navigation menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-1 p-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    currentPath === item.path
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
