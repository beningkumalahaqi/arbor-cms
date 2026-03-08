# How to Create a New Widget

This guide walks you through adding a new widget type to the Arbor CMS widget system. The process follows the same registry pattern used by page types and templates.

## Overview

A widget consists of three parts:

1. **Widget Definition** — declares the widget's type, label, category, icon, and configurable properties
2. **Widget Renderer** — a React component that renders the widget on the live site
3. **Registration** — wiring the definition and renderer into their respective registries

## Step 1: Create the Widget Definition

Create a new file in `lib/widgets/definitions/`. For example, to create a "Video" widget:

```ts
// lib/widgets/definitions/video.ts
import type { WidgetDefinition } from "../types";

export const videoWidget: WidgetDefinition = {
  type: "video",                    // unique identifier
  label: "Video",                   // display name in admin UI
  description: "Embed a video",     // shown in the "Add Widget" dialog
  icon: "M23 7l-7 5 7 5V7z M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11",  // SVG path data
  category: "media",                // one of: content, media, layout, interactive, advanced
  propSchema: [
    {
      name: "url",
      label: "Video URL",
      type: "url",
      required: true,
      placeholder: "https://youtube.com/watch?v=...",
      helpText: "Paste a YouTube or Vimeo URL",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
      defaultValue: "",
    },
    {
      name: "autoplay",
      label: "Autoplay",
      type: "boolean",
      defaultValue: false,
    },
  ],
};
```

### Property Types

The `propSchema` array defines what appears in the admin editor form. Available types:

| Type | Editor Control | Notes |
|------|---------------|-------|
| `text` | Input | Single-line text |
| `textarea` | Textarea | Multi-line plain text |
| `richText` | TipTap Editor | HTML content |
| `number` | Number input | Supports `min`/`max` |
| `select` | Dropdown | Requires `options: { label, value }[]` |
| `image` | Image selector | Uses the file manager |
| `color` | Color picker + text input | Hex color value |
| `boolean` | Checkbox | true/false toggle |
| `url` | URL input | With URL validation |
| `formElements` | Form builder | For the Form widget only |

## Step 2: Register the Definition

Open `lib/widgets/registry.ts` and add your import + register call:

```ts
// At the top, add the import:
import { videoWidget } from "./definitions/video";

// In the registration block at the bottom, add:
register(videoWidget);
```

## Step 3: Create the Widget Renderer

Create a new file in `lib/widgets/renderers/`. The renderer is a React component that receives the widget instance and renders it on the live site.

```tsx
// lib/widgets/renderers/video-renderer.tsx
import type { WidgetInstance } from "../types";

interface VideoRendererProps {
  widget: WidgetInstance;
  pageId: string;
  fullPath: string;
}

export function VideoRenderer({ widget }: VideoRendererProps) {
  const { url, title, autoplay } = widget.props as {
    url: string;
    title: string;
    autoplay: boolean;
  };

  // Convert YouTube URL to embed URL
  const embedUrl = convertToEmbedUrl(url);

  return (
    <div className="my-6">
      {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
      <div className="aspect-video overflow-hidden rounded-lg">
        <iframe
          src={`${embedUrl}${autoplay ? "?autoplay=1" : ""}`}
          className="h-full w-full"
          allowFullScreen
          title={title || "Video"}
        />
      </div>
    </div>
  );
}

function convertToEmbedUrl(url: string): string {
  // Implementation for YouTube/Vimeo URL conversion
  // ...
  return url;
}
```

### Renderer Guidelines

- **Props**: Always accept `{ widget, pageId, fullPath }` even if you don't use all of them
- **Styling**: Use Tailwind CSS classes with design tokens (no hardcoded colors)
- **Client Components**: Add `"use client"` only if you need interactivity (e.g., fetching data, handling events)
- **Server-safe**: Renderers must work in both server and client contexts (they run in the admin preview too)

## Step 4: Register the Renderer

Open `lib/widgets/renderers/registry.ts` and add your renderer:

```ts
// Add the import:
import { VideoRenderer } from "./video-renderer";

// In the registration block, add:
register("video", VideoRenderer);
```

The first argument must match the `type` in your widget definition exactly.

## Step 5: Add a Case to WidgetItem

Open `lib/widgets/renderer.tsx` and add your renderer to the switch statement inside `WidgetItem`:

```tsx
// Add the import at the top:
import { VideoRenderer } from "./renderers/video-renderer";

// In the WidgetItem switch statement, add a case:
case "video":
  return <VideoRenderer {...p} />;
```

The spread `{...p}` passes `{ widget, pageId, fullPath }` to the renderer.

**Note**: We use a static switch statement (not a dynamic lookup) to avoid React's "Cannot create components during render" lint error.

## Step 6: Allow in Template Areas (Optional)

If a template's widget area has an `allowedWidgets` array, you need to add your widget type to it. Open the relevant template file (e.g., `lib/page-template/home-template.tsx`) and add `"video"` to the area's `allowedWidgets`:

```ts
export const homeAreas: WidgetAreaDefinition[] = [
  {
    name: "hero",
    label: "Hero Section",
    allowedWidgets: ["hero-banner", "heading", "rich-text", "image", "button", "spacer", "video"],
    maxWidgets: 3,
  },
  // ...
];
```

If the area has no `allowedWidgets` (or it's `undefined`), all widgets are automatically allowed.

## That's It!

Your new widget will automatically:

- ✅ Appear in the "Add Widget" dialog in the admin page editor (grouped by category)
- ✅ Show the correct icon and description
- ✅ Render a prop editor form based on your `propSchema`
- ✅ Validate props on save via the API
- ✅ Render on the live site via the registered renderer
- ✅ Show in the admin preview panel

## File Checklist

| File | Action |
|------|--------|
| `lib/widgets/definitions/video.ts` | Create widget definition |
| `lib/widgets/registry.ts` | Import + register definition |
| `lib/widgets/renderers/video-renderer.tsx` | Create renderer component |
| `lib/widgets/renderers/registry.ts` | Import + register renderer |
| `lib/widgets/renderer.tsx` | Import + add case to WidgetItem switch |
| Template files (optional) | Add to `allowedWidgets` arrays |

## Creating a Container Widget

If your widget needs to wrap other widgets (like Section or Columns), set `isContainer: true` and define `slots`:

```typescript
import type { WidgetDefinition } from "../types";

export const tabsWidget: WidgetDefinition = {
  type: "tabs",
  label: "Tabs",
  description: "Tabbed content with multiple panels.",
  icon: "M4 6h16 M4 12h16 M4 18h16",
  category: "layout",
  isContainer: true,
  slots: [
    { name: "tab1", label: "Tab 1" },
    { name: "tab2", label: "Tab 2" },
    { name: "tab3", label: "Tab 3", maxWidgets: 5 },
  ],
  propSchema: [
    {
      name: "style",
      label: "Tab Style",
      type: "select",
      defaultValue: "underline",
      options: [
        { label: "Underline", value: "underline" },
        { label: "Boxed", value: "boxed" },
      ],
    },
  ],
};
```

Your renderer receives `allWidgets` and `renderWidget` and must filter children by `parentId` and `slot`:

```tsx
import type { WidgetInstance } from "../types";

export function TabsRenderer({
  widget,
  allWidgets = [],
  renderWidget = () => null,
}: {
  widget: WidgetInstance;
  allWidgets?: WidgetInstance[];
  renderWidget?: (w: WidgetInstance) => React.ReactNode;
}) {
  const tab1 = allWidgets
    .filter((w) => w.parentId === widget.id && w.slot === "tab1")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const tab2 = allWidgets
    .filter((w) => w.parentId === widget.id && w.slot === "tab2")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div>{tab1.map(renderWidget)}</div>
      <div>{tab2.map(renderWidget)}</div>
    </div>
  );
}
```

In `renderer.tsx`, pass `allWidgets` and `renderWidget` in the switch case:

```typescript
case "tabs": return <TabsRenderer {...p} allWidgets={allWidgets} renderWidget={renderWidget} />;
```

**Important:** Containers cannot be nested inside other containers. The admin widget editor automatically filters out container widgets when adding children to a slot.

## Architecture Notes

- **Widget definitions** are registered in code, not in the database (same as page types)
- **Widget instances** (placed on pages) are stored in the `Widget` database table
- **Widget areas** are defined in template code — they declare where widgets can be placed
- **Props** are stored as JSON in the database, validated against the `propSchema` on save
- The admin editor auto-generates forms from `propSchema` — no custom editor code needed per widget
