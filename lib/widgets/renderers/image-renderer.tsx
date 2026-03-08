import type { WidgetInstance } from "../types";

export function ImageRenderer({ widget }: { widget: WidgetInstance }) {
  const { src, alt = "", caption, link, rounded = true } = widget.props as {
    src: string;
    alt: string;
    caption: string;
    link: string;
    rounded: boolean;
  };

  if (!src) return null;

  const imgSrc = src.startsWith("http") ? src : `/api/storage/file/${src}`;
  const roundedClass = rounded ? "rounded-xl" : "";

  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={`h-auto w-full object-cover ${roundedClass}`}
    />
  );

  const wrappedImage = link ? (
    <a href={link} target="_blank" rel="noopener noreferrer">
      {image}
    </a>
  ) : (
    image
  );

  return (
    <figure>
      {wrappedImage}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
