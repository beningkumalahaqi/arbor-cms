# How to Create a New Page Type

This guide walks you through adding a new Page Type to Arbor CMS. Page Types are defined in code and automatically available in the admin UI once registered.

---

## Overview

A Page Type defines a kind of page — what it's called, what content fields it has, and how those fields are validated. All Page Types live in `lib/page-types/` and are registered in `lib/page-types/registry.ts`.

---

## Step-by-Step

### 1. Create the Page Type file

Create a new file in `lib/page-types/`. Name it after your page type.

**Example:** `lib/page-types/blog-post.ts`

```typescript
import { PageTypeDefinition } from "./types";

export const blogPostPageType: PageTypeDefinition = {
  name: "blog-post",
  label: "Blog Post",
  description: "A blog post with title, body, and optional summary.",
  allowedProperties: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: true,
      defaultValue: "",
    },
    {
      name: "summary",
      label: "Summary",
      type: "text",
      required: false,
      defaultValue: "",
    },
    {
      name: "body",
      label: "Body",
      type: "richText",
      required: true,
      defaultValue: "",
    },
  ],
};
```

### 2. Register the Page Type

Open `lib/page-types/registry.ts` and:

1. Import your new page type.
2. Call `register()` with it.

```typescript
import { blogPostPageType } from "./blog-post";

// Add alongside existing registrations
register(blogPostPageType);
```

### 3. Create a Page Template

Every page type must have exactly one page template — a React component that controls how the page renders on the public site. Create a new file in `lib/page-template/`.

**Example:** `lib/page-template/blog-post-template.tsx`

```tsx
import type { PageTemplateProps } from "./types";

export function BlogPostTemplate({ content }: PageTemplateProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <article>
        {content.title && (
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {content.title}
          </h1>
        )}
        {content.summary && (
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {content.summary}
          </p>
        )}
        {content.body && (
          <div className="prose mt-8 max-w-none text-zinc-700 dark:text-zinc-300">
            {content.body.split("\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
```

### 4. Register the Page Template

Open `lib/page-template/registry.ts` and:

1. Import your template component.
2. Call `register()` with the page type name and template.

```typescript
import { BlogPostTemplate } from "./blog-post-template";

// Add alongside existing registrations
register("blog-post", BlogPostTemplate);
```

That's it. The page type and its template are now available system-wide.

### 5. Configure Settings in the Admin UI (Optional)

After registering a new page type, you can configure its settings through the admin interface at `/admin/page-types`:

- **Icon** — Select a display icon for the page type from the curated icon set. This icon appears in the page tree and page type listings.
- **Allowed Children** — Restrict which page types can be created as children under pages of this type. Leave empty to allow all page types.

These settings are stored in the `PageTypeSettings` database model and don't require any code changes.

---

## What Happens Automatically

Once registered, your new page type will:

- Appear in the **Page Types** admin screen (`/admin/page-types`)
- Be selectable when creating a new page in the admin UI
- Have its properties rendered as form fields automatically
- Be validated server-side when pages of this type are created or updated
- Render using its registered page template on the public site
- Be configurable with a custom icon and allowed children settings via the admin UI
- Respect parent page's allowed children restrictions when creating new pages

---

## Reference: PageTypeDefinition

```typescript
interface PageTypeDefinition {
  name: string;           // Unique identifier (used in database)
  label: string;          // Display name in admin UI
  description: string;    // Shown in the page types list
  allowedProperties: PropertyDefinition[];
}
```

## Reference: PageTemplateProps

```typescript
interface PageTemplateProps {
  content: PageContent;   // The page's content fields
  pageType: string;       // The page type name
  fullPath: string;       // The page's URL path
}
```

Each property in `allowedProperties` follows the `PropertyDefinition` interface. See the [How to Create New Properties](how-to-create-new-properties.md) guide for details on supported property types and how to add custom ones.

---

## Tips

- Use kebab-case for the `name` field (e.g., `"blog-post"`, `"landing-page"`).
- Name template files to match the page type (e.g., `blog-post` → `blog-post-template.tsx`).
- The `name` must be unique across all registered page types.
- If your page type has special routing rules (like the Home type), enforcement logic goes in `app/api/pages/route.ts`, not in the type definition.
- Keep property lists focused — a type with too many fields makes the admin form unwieldy.
