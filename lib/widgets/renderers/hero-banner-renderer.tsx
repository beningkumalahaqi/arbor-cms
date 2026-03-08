import type { WidgetInstance } from "../types";

const heightClasses: Record<string, string> = {
  sm: "min-h-[300px]",
  md: "min-h-[450px]",
  lg: "min-h-[600px]",
  full: "min-h-screen",
};

const alignmentClasses: Record<string, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
};

export function HeroBannerRenderer({ widget }: { widget: WidgetInstance }) {
  const {
    backgroundImage,
    title,
    subtitle,
    ctaText,
    ctaUrl,
    height = "md",
    overlay = true,
    alignment = "center",
  } = widget.props as {
    backgroundImage: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaUrl: string;
    height: string;
    overlay: boolean;
    alignment: string;
  };

  const heightClass = heightClasses[height] || heightClasses.md;
  const alignClass = alignmentClasses[alignment] || alignmentClasses.center;
  const bgSrc = backgroundImage
    ? backgroundImage.startsWith("http")
      ? backgroundImage
      : `/api/storage/file/${backgroundImage}`
    : "";

  return (
    <div
      className={`relative flex ${heightClass} w-full flex-col justify-center ${alignClass} overflow-hidden px-6`}
      style={
        bgSrc
          ? { backgroundImage: `url(${bgSrc})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {overlay && bgSrc && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className="relative z-10 max-w-3xl space-y-4">
        {title && (
          <h1 className={`text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl ${bgSrc ? "text-white" : "text-foreground"}`}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className={`text-lg sm:text-xl ${bgSrc ? "text-white/90" : "text-muted-foreground"}`}>
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaUrl || "#"}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
