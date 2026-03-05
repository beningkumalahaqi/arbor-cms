# Project Coding Instructions

This project is a custom CMS built with Next.js App Router, TypeScript, Prisma, and Tailwind CSS.

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
- `app/api/` — REST endpoints: `bootstrap/`, `auth/`, `pages/`, `page-types/settings/`, `storage/`
- `app/[[...slug]]/` — Catch-all route resolving `fullPath` from database
- `components/ui/` — Shared reusable UI components (Button, Input, Textarea, Select, Card, Table, FormField, PageLayout, PageTypeIcon)
- `components/admin/` — Admin-specific components (AdminShell with sidebar, PageTree, FileExplorer with drag-and-drop and sortable columns, ImageSelectorModal, ImageField, RichTextEditor)
- `lib/auth/` — Authentication: credentials (bcrypt), session (cookie-based), helpers (requireAuth, requireRole)
- `lib/page-types/` — Page Type definitions, registry, and type exports
- `lib/page-template/` — Page Template components and registry (one template per page type)
- `lib/properties/` — Property validation and default content builder
- `lib/storage.ts` — File system storage utility (CRUD, move, path safety, mime types)
- `lib/db.ts` — PrismaClient singleton using libSQL adapter
- `lib/icons.ts` — Curated SVG icon definitions for page types (name, label, SVG path)
- `lib/validation.ts` — Shared validators (email, slug, required fields)
- `prisma/schema.prisma` — Database schema (User, Page, PageTypeSettings models)
- `docs/` — Release documentation
- `guide/` — Developer guides for extending the CMS

## Database Models
### User
- `id` (cuid), `email` (unique), `name`, `password` (bcrypt hash), `role` (string, default "superadmin")
- Role stored as string for future extensibility — not an enum

### Page
- `id` (cuid), `parentId` (nullable self-relation), `slug`, `fullPath` (unique), `pageType`, `status` ("draft" | "published"), `content` (JSON as string), `sortOrder`
- Self-relation `PageTree` for parent/children hierarchy
- Indexed on: `parentId`, `fullPath`, `status`

### PageTypeSettings
- `id` (cuid), `pageTypeName` (unique), `icon` (string, default "file"), `allowedChildren` (JSON array as string, default "[]")
- Stores admin-configurable settings per page type: display icon and which child page types are allowed
- Settings are managed via the admin UI, not in code

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
- Templates are server components — kept separate from page type definitions to avoid pulling React into client bundles
- Adding a new template: create component file in `lib/page-template/`, import and register in registry.ts

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

## UI & Tailwind Rules
- Tailwind CSS is the only styling solution
- Tailwind Typography plugin (`@tailwindcss/typography`) used for `prose` classes in rich text rendering
- No inline styles
- No duplicated utility class patterns across files
- Reusable UI components must live in `/components/ui`
- Use variants and composition instead of one-off styles
- Admin pages must use the shared `AdminShell` layout via `app/admin/layout.tsx`
- All admin page content should use `PageLayout` component for consistent headers

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
- Page creation auto-creates a corresponding folder in `/storage/pages/` matching the page hierarchy
- Home page creation additionally enforces: singleton check, no parent, forced `fullPath = "/"`
- Page type settings managed via `/api/page-types/settings` (GET for list, PUT for upsert)
- File management via `/api/storage` (GET list, POST create/upload/rename/move, DELETE)
- File serving via `/api/storage/file/[...path]` (GET with caching headers)

## Security
- Never trust client input
- Always enforce permissions server-side
- UI permission checks are secondary
- Passwords hashed with bcrypt (12 rounds)
- Session cookies are httpOnly, sameSite lax, secure in production
- File uploads: max 10MB, blocked executable extensions (.exe, .bat, .sh, .js, .php, etc.)
- File names sanitized — only alphanumeric, hyphens, underscores, dots, spaces
- Path traversal prevention on all storage operations

## Extensibility
- Architecture must allow:
  - Additional roles (role is a string, not enum)
  - Additional property types (add to PropertyType union)
  - Additional page types (add file + register in both page-types and page-template registries)
  - Additional page templates (one per page type, registered in page-template registry)
  - Additional icons (add to `availableIcons` array in `lib/icons.ts`)
  - Additional page type settings (extend PageTypeSettings model)
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