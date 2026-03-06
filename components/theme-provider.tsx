"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export type Theme = "auto" | "dark" | "light";

interface ThemeContextValue {
  adminTheme: Theme;
  siteTheme: Theme;
  setAdminTheme: (theme: Theme) => void;
  setSiteTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  adminTheme: "auto",
  siteTheme: "auto",
  setAdminTheme: () => {},
  setSiteTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  if (resolved === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") || pathname === "/login" || pathname === "/setup";
}

function readStored(key: string): Theme {
  const v = localStorage.getItem(key);
  return v === "dark" || v === "light" ? v : "auto";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [adminTheme, setAdminState] = useState<Theme>("auto");
  const [siteTheme, setSiteState] = useState<Theme>("auto");

  const setAdminTheme = useCallback((t: Theme) => {
    setAdminState(t);
    localStorage.setItem("theme-admin", t);
  }, []);

  const setSiteTheme = useCallback((t: Theme) => {
    setSiteState(t);
    localStorage.setItem("theme-site", t);
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setAdminState(readStored("theme-admin"));
    setSiteState(readStored("theme-site"));
  }, []);

  // Apply the correct theme whenever route or either theme value changes
  useEffect(() => {
    const active = isAdminRoute(pathname) ? adminTheme : siteTheme;
    applyTheme(active);
  }, [pathname, adminTheme, siteTheme]);

  // Listen for system preference changes (matters when either theme is "auto")
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const active = isAdminRoute(pathname) ? adminTheme : siteTheme;
      if (active === "auto") applyTheme("auto");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pathname, adminTheme, siteTheme]);

  return (
    <ThemeContext.Provider value={{ adminTheme, siteTheme, setAdminTheme, setSiteTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
