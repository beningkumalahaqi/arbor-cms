interface SiteFooterProps {
  logo: string;
  text: string;
}

export function SiteFooter({ logo, text }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            {logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`/api/storage/file/${logo}`}
                alt="Site logo"
                className="h-7 w-7 rounded object-contain"
              />
            )}
            {text && (
              <span className="text-sm font-medium text-foreground">{text}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {year} {text || "All rights reserved"}.
          </p>
        </div>
      </div>
    </footer>
  );
}
