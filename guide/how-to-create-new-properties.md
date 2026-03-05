# How to Create New Properties

This guide explains how to add new property types to Arbor CMS. Properties are the content fields that make up a page — things like titles, descriptions, or any custom field type you define.

---

## Overview

The properties system has two layers:

1. **Property types** — The kinds of fields available (e.g., `text`, `richText`). Defined in `lib/page-types/types.ts`.
2. **Property definitions** — The specific fields a Page Type declares (e.g., a "title" field of type `text`). Defined per Page Type in its definition file.

---

## Using Existing Property Types

If you just need to add a new field to a Page Type using an existing type (`text` or `richText`), you only need to update the Page Type definition.

Open the Page Type file (e.g., `lib/page-types/content.ts`) and add a new entry to `allowedProperties`:

```typescript
allowedProperties: [
  // ... existing properties
  {
    name: "author",
    label: "Author",
    type: "text",
    required: false,
    defaultValue: "",
  },
],
```

No other changes needed. The admin form will render the new field automatically.

---

## Adding a New Property Type

When you need a field type that doesn't exist yet (e.g., `number`, `date`, `boolean`), follow these steps:

### 1. Extend the PropertyType union

Open `lib/page-types/types.ts` and add your type to the union:

```typescript
// Current
export type PropertyType = "text" | "richText" | "image";

// After
export type PropertyType = "text" | "richText" | "image" | "number";
```

### 2. Update the admin form rendering

Open `app/admin/pages/new/page.tsx` and `app/admin/pages/[id]/page.tsx`. Find where properties are rendered (the section that checks `prop.type`). Add a case for your new type. Currently, `text` renders an `Input`, `image` renders an `ImageField` with modal selector, and `richText` renders the `RichTextEditor`. Add a new branch for your type:

```tsx
{prop.type === "text" ? (
  <Input
    value={content[prop.name] ?? ""}
    onChange={(e) =>
      setContent({ ...content, [prop.name]: e.target.value })
    }
    required={prop.required}
  />
) : prop.type === "number" ? (
  <Input
    type="number"
    value={content[prop.name] ?? ""}
    onChange={(e) =>
      setContent({ ...content, [prop.name]: e.target.value })
    }
    required={prop.required}
  />
) : (
  <Textarea
    value={content[prop.name] ?? ""}
    onChange={(e) =>
      setContent({ ...content, [prop.name]: e.target.value })
    }
    required={prop.required}
    rows={4}
  />
)}
```

### 3. Update validation (if needed)

Open `lib/properties/index.ts`. The `validateProperties()` function currently checks `required` fields. If your new type has additional validation rules (e.g., numbers must be positive), add them:

```typescript
export function validateProperties(
  definitions: PropertyDefinition[],
  content: PageContent
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const def of definitions) {
    const value = content[def.name];

    if (def.required && (!value || value.trim() === "")) {
      errors.push({
        field: def.name,
        message: `${def.label} is required.`,
      });
    }

    // Add type-specific validation
    if (def.type === "number" && value && isNaN(Number(value))) {
      errors.push({
        field: def.name,
        message: `${def.label} must be a valid number.`,
      });
    }
  }

  return errors;
}
```

---

## Reference: PropertyDefinition

```typescript
interface PropertyDefinition {
  name: string;           // Field key in the content JSON
  label: string;          // Display label in admin forms
  type: PropertyType;     // "text" | "richText" | "image" | your custom type
  required?: boolean;     // Whether the field must be filled
  defaultValue?: string;  // Pre-filled value on page creation
}
```

All property values are stored as strings in a JSON blob on the Page model. The `content` column stores the serialized object.

---

## Currently Supported Types

| Type | Rendered As | Description |
|------|-----------|-------------|
| `text` | `<Input>` | Single-line text input |
| `richText` | `<RichTextEditor>` | TipTap WYSIWYG editor with raw HTML toggle |
| `image` | `<ImageField>` | Image selector with modal browser from `/storage` |

---

## Tips

- All content values are stored as strings. If you add a numeric type, it will be stored as `"42"` not `42`. Parse on read if needed.
- Keep property names in camelCase (e.g., `"publishDate"`, `"authorName"`).
- The rendering logic is in two places (new page + edit page). Keep them in sync when adding new types.
- Add a new UI component in `components/ui/` if your property type needs a specialized input (e.g., date picker, file upload).
