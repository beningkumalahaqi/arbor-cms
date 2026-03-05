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

That's it. The page type is now available system-wide.

---

## What Happens Automatically

Once registered, your new page type will:

- Appear in the **Page Types** admin screen (`/admin/page-types`)
- Be selectable when creating a new page in the admin UI
- Have its properties rendered as form fields automatically
- Be validated server-side when pages of this type are created or updated

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

Each property in `allowedProperties` follows the `PropertyDefinition` interface. See the [How to Create New Properties](how-to-create-new-properties.md) guide for details on supported property types and how to add custom ones.

---

## Tips

- Use kebab-case for the `name` field (e.g., `"blog-post"`, `"landing-page"`).
- The `name` must be unique across all registered page types.
- If your page type has special routing rules (like the Home type), enforcement logic goes in `app/api/pages/route.ts`, not in the type definition.
- Keep property lists focused — a type with too many fields makes the admin form unwieldy.
