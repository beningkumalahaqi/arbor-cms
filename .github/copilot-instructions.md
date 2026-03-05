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
- `app/api/` — REST endpoints: `bootstrap/`, `auth/`, `pages/`
- `app/[[...slug]]/` — Catch-all route resolving `fullPath` from database
- `components/ui/` — Shared reusable UI components (Button, Input, Textarea, Select, Card, Table, FormField, PageLayout)
- `components/admin/` — Admin-specific components (AdminShell with sidebar)
- `lib/auth/` — Authentication: credentials (bcrypt), session (cookie-based), helpers (requireAuth, requireRole)
- `lib/page-types/` — Page Type definitions, registry, and type exports
- `lib/properties/` — Property validation and default content builder
- `lib/db.ts` — PrismaClient singleton using libSQL adapter
- `lib/validation.ts` — Shared validators (email, slug, required fields)
- `prisma/schema.prisma` — Database schema (User, Page models)
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

## Page Types
- Defined in code under `lib/page-types/`, one file per type
- Registered in `lib/page-types/registry.ts` via `register()` call
- Each type declares: `name`, `label`, `description`, `allowedProperties`
- The `home` page type is a singleton — only one can exist, always serves `/`, cannot have a parent
- The `content` page type is generic and can exist anywhere in the tree
- Adding a new page type: create file, define PageTypeDefinition, import and register in registry.ts
- See `guide/how-to-create-a-new-page-type.md` for step-by-step

## Properties System
- Properties are defined per Page Type via `PropertyDefinition[]`
- Supported types: `text`, `richText` (extensible via `PropertyType` union)
- Each property has: `name`, `label`, `type`, `required?`, `defaultValue?`
- Content stored as JSON string on the Page model
- Admin forms render dynamically based on property definitions
- Validation runs server-side in API routes via `validateProperties()`
- Adding a new property type: extend `PropertyType`, update admin form rendering, update validation if needed
- See `guide/how-to-create-new-properties.md` for step-by-step

## UI & Tailwind Rules
- Tailwind CSS is the only styling solution
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

## API Route Patterns
- All mutations go through `/app/api/` routes
- Auth checked via `getSession()` at the start of every handler
- Validation happens server-side before any database write
- Page creation enforces: valid page type, valid slug, unique fullPath, property validation
- Home page creation additionally enforces: singleton check, no parent, forced `fullPath = "/"`

## Security
- Never trust client input
- Always enforce permissions server-side
- UI permission checks are secondary
- Passwords hashed with bcrypt (12 rounds)
- Session cookies are httpOnly, sameSite lax, secure in production

## Extensibility
- Architecture must allow:
  - Additional roles (role is a string, not enum)
  - Additional property types (add to PropertyType union)
  - Additional page types (add file + register)
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