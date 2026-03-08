# Project Coding Instructions

This project is a custom CMS built with Next.js App Router, TypeScript, Prisma, Tailwind CSS, and shadcn/ui.

## General Rules
- Prefer clarity over clever abstractions
- No business logic in UI components
- No database access outside Prisma
- All mutations must be validated server-side

## Architecture
- App Router only
- Server Components by default
- Client Components only when required
- API routes handle mutations and authentication
- Prisma is the single source of truth for database access
- Prisma 7 with `@prisma/adapter-libsql` — PrismaClient requires a driver adapter in constructor
- `prisma.config.ts` at project root defines schema path and datasource URL

## Folder Structure
- `app/` — Next.js App Router pages and API routes
- `app/admin/` — Admin UI, protected by auth (layout checks session + redirects)
- `app/admin/forms/` — Form submissions admin pages (list + detail)
- `app/api/` — REST endpoints: `bootstrap/`, `auth/`, `pages/`, `page-types/settings/`, `storage/`, `site-settings/`, `site-navigation/`, `widgets/`, `form-types/`, `forms/`
- `app/[[...slug]]/` — Catch-all route resolving `fullPath` from database
- `components/ui/` — Shared reusable UI components (shadcn/ui-based: Button, Input, Textarea, Select, Card, Table, Badge, Label, Dialog, RadioGroup, Separator, Tooltip, FormField, PageLayout, PageTypeIcon)
- `components/admin/` — Admin-specific components (AdminShell with collapsible sidebar, PageTree, PagePreview, FileExplorer, ImageSelectorModal, ImageField, RichTextEditor, WidgetEditor, FormElementsEditor)
- `components/site/` — Live site components (SiteNavigation with responsive hamburger menu, SiteFooter, SiteLayout wrapper)
- `components/theme-provider.tsx` — Dual-theme context provider (admin theme + site theme, localStorage persistence)
- `lib/auth/` — Authentication: credentials (bcrypt), session (cookie-based), helpers (requireAuth, requireRole)
- `lib/page-types/` — Page Type definitions, registry, and type exports
- `lib/page-template/` — Page Template components and registry (one template per page type)
- `lib/properties/` — Property validation and default content builder
- `lib/storage/` — Database-backed file storage module (types, DB operations, index re-exports)
- `lib/widgets/` — Widget system: types, registry, renderer, definitions, renderers
- `lib/widgets/definitions/` — Widget definition files (one per widget type)
- `lib/widgets/renderers/` — Widget renderer components (one per widget type)
- `lib/db.ts` — PrismaClient singleton using libSQL adapter
- `lib/utils.ts` — `cn()` utility for merging Tailwind classes (clsx + tailwind-merge)
- `lib/icons.ts` — Curated SVG icon definitions for page types (name, label, SVG path)
- `lib/validation.ts` — Shared validators (email, slug, required fields)
- `prisma/schema.prisma` — Database schema (User, Page, PageTypeSettings, StorageFile, StorageFolder, SiteSettings, Widget, FormSubmission, FormType models)
- `docs/` — Release documentation
- `guide/` — Developer guides for extending the CMS

## Database Models
### User
- `id` (cuid), `email` (unique), `name`, `password` (bcrypt hash), `role` (string, default "superadmin")
- Role stored as string for future extensibility — not an enum

### Page
- `id` (cuid), `parentId` (nullable self-relation), `slug`, `fullPath` (unique), `pageType`, `status` ("draft" | "published"), `content` (JSON as string), `sortOrder`, `showInNav` (int, 0/1), `navLabel` (string)
- Self-relation `PageTree` for parent/children hierarchy
- `showInNav` controls whether the page appears in the site navigation (only top-level pages)
- `navLabel` is the custom label for the navigation; if empty, defaults to Title Case of the slug
- Indexed on: `parentId`, `fullPath`, `status`

### PageTypeSettings
- `id` (cuid), `pageTypeName` (unique), `icon` (string, default "file"), `allowedChildren` (JSON array as string, default "[]")
- Stores admin-configurable settings per page type: display icon and which child page types are allowed
- Settings are managed via the admin UI, not in code

### StorageFile
- `id` (cuid), `name`, `path` (unique), `mimeType`, `size` (int), `data` (Bytes/blob), `createdAt`, `updatedAt`
- Stores uploaded files as binary blobs in the database
- Indexed on: `path`

### StorageFolder
- `id` (cuid), `path` (unique), `createdAt`
- Represents virtual folder structure for the file manager
- Indexed on: `path`

### SiteSettings
- `id` (cuid), `navigationEnabled` (int, default 1), `navigationLogo` (string), `navigationTitle` (string, default "Arbor CMS"), `footerEnabled` (int, default 1), `footerLogo` (string), `footerText` (string)
- Singleton row — only one record exists, upserted on save
- Stores global site-wide settings for navigation and footer
- Managed via admin Settings page and `/api/site-settings` endpoint

### Widget
- `id` (cuid), `pageId` (relation to Page), `area` (string), `type` (string), `props` (JSON as string), `sortOrder` (int)
- `parentId` (nullable self-relation for nesting), `slot` (string, default "")
- Self-relation `WidgetTree` for parent/children hierarchy (container widget support)
- Cascade delete: widgets are deleted when their parent page is deleted; child widgets cascade from parent widget
- Indexed on: `pageId`, `pageId+area`, `parentId`

### FormSubmission
- `id` (cuid), `widgetId` (string), `pageId` (string), `data` (JSON as string), `createdAt`
- `formTypeId` (string, default "") — links to FormType for grouping
- Indexed on: `widgetId`, `pageId`, `formTypeId`

### FormType
- `id` (cuid), `name` (string), `elements` (JSON array as string), `createdAt`, `updatedAt`
- Stores form structure independently — survives widget deletion
- Used to group submissions and reuse form definitions across widgets
- Indexed on: `name`

## Page Types
- Defined in code under `lib/page-types/`, one file per type
- Registered in `lib/page-types/registry.ts` via `register()` call
- Each type declares: `name`, `label`, `description`, `allowedProperties`
- The `home` page type is a singleton — only one can exist, always serves `/`, cannot have a parent
- Home page is auto-created during bootstrap (first SuperAdmin setup) if it doesn't exist
- The `content` page type is generic and can exist anywhere in the tree
- The `article` page type has title (text), image banner (image), and content (richText) properties
- Each page type must have exactly one page template registered in `lib/page-template/registry.ts`
- Adding a new page type: create definition file, register in page-types registry, create template, register in page-template registry
- See `guide/how-to-create-a-new-page-type.md` for step-by-step

## Page Type Settings
- Stored in the `PageTypeSettings` model, managed via admin UI at `/admin/page-types`
- **Icon**: Each page type can have a display icon selected from a curated set in `lib/icons.ts`
- **Allowed Children**: Each page type can restrict which child page types are permitted underneath it
- Settings are configured in the admin UI, not in code — no code changes needed to update icons or child restrictions
- API endpoint: `GET/PUT /api/page-types/settings`
- When `allowedChildren` is empty, all page types are allowed as children (no restriction)
- The `home` page type defaults to icon `"home"` and allowed children `["content"]` on bootstrap

## Page Tree
- Pages are displayed as a collapsible tree in the admin UI (`/admin/pages`)
- The tree view component is `components/admin/page-tree.tsx`
- Tree nodes show the page type icon, page name, full path, type badge, and status badge
- Nodes with children have expand/collapse toggles
- The API supports `?tree=true` query parameter to return pages with children and settings in one request

## Icon System
- Curated SVG icon set defined in `lib/icons.ts` — each icon has a `name`, `label`, and `path` (SVG path data)
- `PageTypeIcon` component in `components/ui/page-type-icon.tsx` renders icons from path data
- Icons are selectable per page type in the admin settings UI
- To add new icons: add entries to `availableIcons` array in `lib/icons.ts`

## Page Templates
- Defined in `lib/page-template/`, one template component per page type
- Registered in `lib/page-template/registry.ts` via `register()` call — maps page type name to a React component
- Each template receives `PageTemplateProps`: `content`, `pageType`, `fullPath`
- The catch-all route (`app/[[...slug]]/`) looks up the template by page type name and renders it
- Templates are also used by the admin preview panel (`components/admin/page-preview.tsx`) to render live previews during editing
- Templates must be compatible with both server and client rendering since the preview runs client-side
- Adding a new template: create component file in `lib/page-template/`, import and register in registry.ts

## Widget System
- Widgets are composable content blocks that can be added to any page via the admin UI
- Defined in code under `lib/widgets/definitions/`, one file per widget type
- Registered in `lib/widgets/registry.ts` via `register()` call
- Each widget declares: `type`, `label`, `description`, `icon`, `category`, `propSchema`
- 12 built-in widgets: heading, rich-text, image, button, section, columns, spacer, divider, page-list, form, html, hero-banner
- 5 categories: `content`, `media`, `layout`, `interactive`, `advanced`
- Widget props support 10 types: `text`, `textarea`, `richText`, `number`, `select`, `image`, `color`, `boolean`, `url`, `formElements`
- Adding a new widget: create definition file, register in widget registry, create renderer, register renderer, add case to WidgetItem switch
- See `guide/how-to-create-a-new-widget.md` for step-by-step

## Widget Rendering
- `lib/widgets/renderer.tsx` contains `WidgetItem` (renders a single widget) and `WidgetArea` (renders all widgets in an area)
- `lib/widgets/renderers/registry.ts` maps widget types to React renderer components
- Each renderer receives the widget's `props` object plus optional `allWidgets` and `renderWidget` for container support
- `WidgetArea` filters for top-level widgets (no parentId) in the specified area, then passes the full widget array as `allWidgets`
- Templates declare `WidgetAreaDefinition[]` to specify named areas (e.g., `"main"`, `"sidebar"`)
- The catch-all route loads widgets from the database and passes them to the template for rendering

## Container Widgets
- Section and Columns widgets are containers that wrap other widgets (not their own content)
- Container widgets declare `isContainer: true` and `slots: WidgetSlotDefinition[]` in their definition
- Each slot has a `name`, `label`, optional `allowedWidgets` filter, and optional `maxWidgets` limit
- Section has one slot: `"content"` — Columns has up to three: `"column1"`, `"column2"`, `"column3"`
- Child widgets are stored in the database with `parentId` pointing to the container and `slot` identifying the slot
- Container renderers use a render-prop pattern: they receive a `renderWidget` callback and call it for each child
- Containers **cannot** be nested inside other containers (prevents infinite recursion)
- The widget editor shows inline slot management when editing a container widget

## Form System
- The Form widget lets admins create custom forms with configurable fields
- Form structure is stored in the `FormType` model, independent from widgets — survives widget deletion
- Each Form widget references a `formTypeId` in its props
- FormTypes are auto-created when saving a form widget or on first submission
- When adding a Form widget, admins can reuse an existing FormType or create a new one
- Form elements support types: text, email, textarea, select, checkbox, radio, button
- Submissions are stored in `FormSubmission` with `formTypeId` linking to the FormType
- If a linked FormType is deleted, the widget editor shows an error banner with a "Create Form Type" option
- Admin form submissions page at `/admin/forms` groups submissions by FormType
- See `guide/how-to-create-a-form.md` and `guide/how-forms-work.md` for details

## Properties System
- Properties are defined per Page Type via `PropertyDefinition[]`
- Supported types: `text`, `richText`, `image` (extensible via `PropertyType` union)
- Each property has: `name`, `label`, `type`, `required?`, `defaultValue?`
- Content stored as JSON string on the Page model
- Admin forms render dynamically based on property definitions
- `text` renders an `Input`, `richText` renders the TipTap `RichTextEditor`, `image` renders the `ImageField` with modal selector
- Validation runs server-side in API routes via `validateProperties()`
- Adding a new property type: extend `PropertyType`, update admin form rendering, update validation if needed
- See `guide/how-to-create-new-properties.md` for step-by-step

## Admin Shell
- The `AdminShell` component (`components/admin/admin-shell.tsx`) provides the sidebar layout for all admin pages
- Sidebar is collapsible — toggled via a chevron button in the header
- Collapsed mode shows SVG icons for each nav item and an icon-only logout button
- Expanded mode shows full nav labels and user info
- Nav icons are defined as a `navIcons` record mapping routes to SVG elements

## Page Editor Preview
- The edit page (`app/admin/pages/[id]/page.tsx`) has a split-pane layout with editor and live preview
- Preview is rendered by `components/admin/page-preview.tsx` using the registered page templates
- The split is resizable via a draggable divider (mouse drag, clamped 20%–80%)
- Preview can be toggled on/off via a button in the page header
- A "View Live" link in the header opens the page's public URL in a new tab
- Both the editor form and preview panel are independently scrollable

## UI & Tailwind Rules
- shadcn/ui is the component library — all base components come from shadcn (Button, Input, Card, Badge, Dialog, etc.)
- shadcn configured with `new-york` style, `neutral` base color, `phosphor` icon library (`components.json`)
- Tailwind CSS is the only styling solution
- All colors use CSS variable design tokens (e.g., `text-foreground`, `bg-background`, `bg-muted`, `text-muted-foreground`, `border`, `bg-primary`, `text-destructive`) — never hardcode color values like `zinc-500` or `blue-600`
- Dark mode uses class strategy: `@custom-variant dark (&:is(.dark *))` in globals.css
- Lime theme defined via oklch CSS variables in `app/globals.css` for both `:root` and `.dark`
- Tailwind Typography plugin (`@tailwindcss/typography`) used for `prose` classes in rich text rendering
- Inline styles are allowed only for dynamic values (e.g., resizable split widths, editor max-height)
- No duplicated utility class patterns across files
- Reusable UI components must live in `/components/ui`
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Use variants and composition instead of one-off styles
- Admin pages must use the shared `AdminShell` layout via `app/admin/layout.tsx`
- All admin page content should use `PageLayout` component for consistent headers

## Theme System
- Dual-theme: separate themes for CMS admin and live (public) site
- `components/theme-provider.tsx` provides `ThemeProvider` context with `adminTheme`, `siteTheme`, `setAdminTheme`, `setSiteTheme`
- Theme values: `"auto"` | `"dark"` | `"light"` — default is `"auto"` (follows OS preference)
- Admin theme applies to routes starting with `/admin`, `/login`, `/setup`
- Site theme applies to all other (public) routes
- Themes persisted in `localStorage` under keys `theme-admin` and `theme-site`
- Flash-prevention inline script in `app/layout.tsx` `<head>` reads the correct key based on initial pathname before React hydrates
- Settings page at `app/admin/settings/page.tsx` provides a 3-option slider (Auto/Light/Dark) for each
- `useTheme()` hook returns the current context values

## Settings
- Settings page at `/admin/settings` — extensible for future settings sections
- Contains: Theme settings, Navigation settings, Footer settings
- **Navigation section**: Enable/disable toggle, site title input, logo image selector (from file manager)
- **Footer section**: Enable/disable toggle, footer text input, logo image selector (from file manager)
- Settings navigation entry is in the admin sidebar shell

## Site Navigation
- Responsive navigation bar rendered on the live (public) site
- Component: `components/site/site-navigation.tsx` — sticky top bar with logo, title, and page links
- Only **top-level published pages** (`parentId = null`, `showInNav = 1`, `status = "published"`) appear in nav
- Child pages (nested under other pages) are excluded from navigation
- Navigation label defaults to Title Case of the page slug; customizable via `navLabel` field in page editor
- Per-page toggle: page editor shows "Show in Navigation" checkbox + label input for top-level pages only
- Mobile: hamburger button opens a collapsible side panel overlay from the right
- Configurable via Settings: enable/disable, logo image, site title
- Data fetched server-side in the catch-all route (`app/[[...slug]]/page.tsx`) via Prisma — no client-side fetch
- Public API: `GET /api/site-navigation` returns nav items + footer config (no auth required)

## Site Footer
- Standard footer rendered on the live (public) site
- Component: `components/site/site-footer.tsx` — displays logo, text, and copyright year
- Configurable via Settings: enable/disable, logo image, footer text
- Site layout wrapper: `components/site/site-layout.tsx` — wraps page content with nav + footer

## Authentication & Authorization
- SuperAdmin bootstrap: `/api/bootstrap` — disabled after first user created
- Login: `/api/auth/login` — sets httpOnly cookie with user ID
- Session: cookie-based via `lib/auth/session.ts` — `getSession()`, `requireAuth()`, `requireRole()`
- Admin layout (`app/admin/layout.tsx`) checks session server-side and redirects to `/login` or `/setup`
- All API mutation routes must verify session before proceeding

## CMS Principles
- Routing is data-driven, not filesystem-driven
- Page Types are registered in code, not in the database
- Page content is stored as structured JSON
- Admin UI consumes the same APIs as public features
- Home page type is singleton: only one allowed, always serves `/`
- Home page auto-created on bootstrap with default content and settings

## API Route Patterns
- All mutations go through `/app/api/` routes
- Auth checked via `getSession()` at the start of every handler
- Validation happens server-side before any database write
- Page creation enforces: valid page type, valid slug, unique fullPath, property validation, allowed children check
- Page creation auto-creates a corresponding StorageFolder in the database matching the page hierarchy
- Home page creation additionally enforces: singleton check, no parent, forced `fullPath = "/"`
- Page type settings managed via `/api/page-types/settings` (GET for list, PUT for upsert)
- File management via `/api/storage` (GET list, POST create/upload/rename/move, DELETE) — all backed by database
- File serving via `/api/storage/file/[...path]` (GET with caching headers, reads from database)
- Site settings via `/api/site-settings` (GET for read, PUT for upsert — auth required for PUT)
- Public navigation data via `/api/site-navigation` (GET, no auth — returns nav items + footer config)
- Widget CRUD via `/api/widgets` (GET list by pageId, POST create) and `/api/widgets/[id]` (GET, PUT, DELETE)
- Widget areas via `/api/widgets/areas` (GET by pageType — returns area definitions)
- Widget reorder via `/api/widgets/reorder` (POST — accepts ordered ID array)
- Form submissions via `/api/widgets/form-submit` (POST, no auth — public endpoint, auto-creates FormType)
- Page list data via `/api/widgets/page-list` (GET by path — returns child pages for Page List widget)
- FormType CRUD via `/api/form-types` (GET list, POST create, DELETE)
- Form submission queries via `/api/forms` (GET — groups by formTypeId or widgetId)

## Security
- Never trust client input
- Always enforce permissions server-side
- UI permission checks are secondary
- Passwords hashed with bcrypt (12 rounds)
- Session cookies are httpOnly, sameSite lax, secure in production
- File uploads: max 10MB, blocked executable extensions (.exe, .bat, .sh, .js, .php, etc.)
- File names sanitized — only alphanumeric, hyphens, underscores, dots, spaces
- Path traversal prevention on all storage operations (normalizePath rejects `..` segments)

## Extensibility
- Architecture must allow:
  - Additional roles (role is a string, not enum)
  - Additional property types (add to PropertyType union)
  - Additional page types (add file + register in both page-types and page-template registries)
  - Additional page templates (one per page type, registered in page-template registry)
  - Additional icons (add to `availableIcons` array in `lib/icons.ts`)
  - Additional page type settings (extend PageTypeSettings model)
  - Additional widgets (add definition + renderer + register in both registries + add case to WidgetItem)
  - Additional widget prop types (extend WidgetPropType union in `lib/widgets/types.ts`)
  - Additional container widget slots (add WidgetSlotDefinition to widget definition)
  - Additional form element types (extend FormElementDefinition in `lib/widgets/types.ts`)
  - Workflow extensions (status is a string field)
- No hardcoded logic blocking future growth

## Code Style
- Small, composable functions
- Clear naming over brevity
- Avoid deeply nested conditionals
- No side effects in render logic

## What NOT to do
- No direct Prisma calls in React components
- No hardcoded page types in routes or components
- No hardcoded roles
- No UI logic mixed with domain logic
- No `datasourceUrl` in PrismaClient constructor (Prisma 7 uses adapter pattern)
- No bare `new PrismaClient()` without adapter
- No filesystem-based storage — all file storage uses the database via `lib/storage/`