# How Forms Work

This guide explains the architecture and data flow of the Arbor CMS form system — from how forms are defined and stored, to how submissions are captured and viewed.

---

## Architecture Overview

The form system has three main components:

1. **Form Widget** — A widget type that renders a configurable form on the public site
2. **Form Type** — An independent database record that stores the form structure (field definitions)
3. **Form Submission** — A database record for each submitted form response

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Form Widget    │──────▶│    Form Type      │◀──────│  Form Submission │
│  (on a page)     │ refs  │  (form structure) │ links │  (submitted data)│
│  formTypeId ─────│───┐   │  name, elements   │   ┌───│  formTypeId      │
└──────────────────┘   │   └──────────────────┘   │   └──────────────────┘
                       └───────────────────────────┘
```

The key design principle: **Form Types are independent from widgets.** A Form Type can outlive its widget, be reused across multiple widgets, and its submissions are preserved even if every widget referencing it is deleted.

---

## Data Models

### FormType

Stored in the `FormType` table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `name` | string | Display name (e.g., "Contact Form") |
| `elements` | JSON string | Array of `FormElementDefinition` objects |
| `createdAt` | datetime | When the form type was created |
| `updatedAt` | datetime | Last update timestamp |

The `elements` field stores the full form structure as a JSON array:

```json
[
  { "id": "abc123", "type": "text-input", "label": "Name", "name": "name", "required": true },
  { "id": "def456", "type": "email-input", "label": "Email", "name": "email", "required": true },
  { "id": "ghi789", "type": "textarea", "label": "Message", "name": "message", "placeholder": "Your message..." },
  { "id": "jkl012", "type": "submit", "label": "Submit", "name": "submit", "buttonText": "Send Message" }
]
```

### FormSubmission

Stored in the `FormSubmission` table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | cuid | Primary key |
| `widgetId` | string | ID of the widget that submitted (for legacy tracking) |
| `pageId` | string | ID of the page the form was on |
| `formTypeId` | string | Links to the FormType (primary grouping key) |
| `data` | JSON string | Key-value pairs of submitted form data |
| `createdAt` | datetime | Submission timestamp |

The `data` field stores the submitted values:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "message": "Hello, I'd like to learn more about your services."
}
```

### Form Widget Props

The Form widget stores these props in its widget instance:

| Prop | Type | Description |
|------|------|-------------|
| `formName` | text | Display name for the form |
| `submitButtonText` | text | Button label (default: "Submit") |
| `successMessage` | text | Message shown after submission |
| `formTypeId` | text (hidden) | Reference to the linked FormType |
| `elements` | formElements | Form field definitions (synced to FormType) |

The `formTypeId` is hidden from the admin prop editor — it's managed automatically by the widget editor.

---

## Lifecycle: Creating a Form

### 1. Admin Adds a Form Widget

When an admin clicks "Add Widget" → "Form", a dialog appears:
- **Reuse existing**: Shows a list of all Form Types. Selecting one populates the widget with that Form Type's fields and sets the `formTypeId`.
- **Create new**: Creates a fresh widget with default empty elements.

### 2. Admin Configures Fields

The widget editor inline panel shows the Form Elements Editor where the admin can add, edit, reorder, and remove fields.

### 3. Widget is Saved

When the widget is saved via `PUT /api/widgets/[id]`:
- If the widget has no `formTypeId` yet, the system calls `POST /api/form-types` to create a new FormType record from the widget's `formName` and `elements`
- The newly created FormType's `id` is stored back in the widget's `formTypeId` prop
- If the widget already has a `formTypeId`, the existing FormType's elements are updated

---

## Lifecycle: Submitting a Form

### 1. Visitor Fills Out the Form

The form is rendered on the public site by the Form Renderer (`lib/widgets/renderers/form-renderer.tsx`). It generates HTML form fields based on the widget's `elements` prop and handles client-side submission.

### 2. Submission is Sent

The form renderer sends a `POST` request to `/api/widgets/form-submit` with:

```json
{
  "widgetId": "widget-abc123",
  "pageId": "page-xyz789",
  "data": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "Hello!"
  }
}
```

### 3. Server Processes the Submission

The `form-submit` API route (`app/api/widgets/form-submit/route.ts`):

1. **No auth required** — this is a public endpoint
2. Validates that `widgetId`, `pageId`, and `data` are present
3. Looks up the widget to find its `formTypeId`
4. **Auto-creates FormType** if the widget doesn't have one yet:
   - Creates a FormType from the widget's `formName` and `elements`
   - Updates the widget's `formTypeId` prop
5. Creates a `FormSubmission` record with the `formTypeId`
6. Returns a success response

### 4. Submission is Stored

The submission is saved with both `widgetId` (legacy) and `formTypeId` (preferred grouping key). This dual-tracking ensures backward compatibility while enabling Form Type–based grouping.

---

## Lifecycle: Viewing Submissions

### Admin Forms List (`/admin/forms`)

The forms list page (`app/admin/forms/page.tsx`):
1. Calls `GET /api/forms` which groups submissions by `formTypeId` (preferred) or `widgetId` (fallback)
2. Displays a table with: Form Name, Form Type badge, Submission Count, Last Submitted date
3. Each row links to a detail page

### Submission Detail (`/admin/forms/[id]`)

The detail page (`app/admin/forms/[widgetId]/page.tsx`):
1. Loads submissions filtered by `formTypeId` (via `?by=formType`) or `widgetId`
2. Extracts all unique field keys from submission data to build dynamic table columns
3. Renders each submission as a row with its data values
4. Supports individual submission deletion

---

## FormType Independence

The FormType model is deliberately independent from widgets:

| Scenario | What Happens |
|----------|--------------|
| Widget is deleted | FormType and all its submissions are preserved |
| FormType is reused on another page | Both widgets reference the same FormType; submissions are grouped together |
| FormType is deleted | Linked widgets show an error banner; submissions are orphaned (still in DB) |
| Widget is recreated | Can link to the existing FormType via the reuse dialog |

This independence is the core design decision — it means form data is never accidentally lost when admins reorganize pages or remove widgets.

---

## Auto-Creation of Form Types

FormTypes are created lazily (not eagerly) in two places:

1. **On widget save** — When saving a Form widget without a `formTypeId`, the widget editor calls the API to create one
2. **On first submission** — If somehow a widget still lacks a `formTypeId` when a visitor submits, the `form-submit` endpoint auto-creates one

This ensures every submission is always linked to a FormType, even if the admin didn't explicitly save the widget before publishing.

---

## API Endpoints

### Form Types

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/form-types` | Required | List all form types |
| `POST` | `/api/form-types` | Required | Create a new form type (body: `{ name, elements }`) |
| `DELETE` | `/api/form-types?id=xxx` | Required | Delete a form type (orphans submissions) |

### Form Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/widgets/form-submit` | **Public** | Submit a form (body: `{ widgetId, pageId, data }`) |
| `GET` | `/api/forms` | Required | List submission groups (supports `?formTypeId=xxx` or `?widgetId=xxx`) |

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/widgets/definitions/form.ts` | Form widget definition with propSchema |
| `lib/widgets/renderers/form-renderer.tsx` | Renders the form on the public site and handles submission |
| `lib/widgets/types.ts` | `FormElementType` and `FormElementDefinition` types |
| `components/admin/widget-editor.tsx` | Widget editor with Form Type reuse dialog and auto-creation |
| `components/admin/form-elements-editor.tsx` | Visual editor for building form fields |
| `app/api/widgets/form-submit/route.ts` | Public submission endpoint |
| `app/api/form-types/route.ts` | FormType CRUD API |
| `app/api/forms/route.ts` | Submission query/grouping API |
| `app/admin/forms/page.tsx` | Admin submissions list page |
| `app/admin/forms/[widgetId]/page.tsx` | Admin submission detail page |
| `prisma/schema.prisma` | FormType and FormSubmission models |
