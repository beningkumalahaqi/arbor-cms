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

## UI & Tailwind Rules
- Tailwind CSS is the only styling solution
- No inline styles
- No duplicated utility class patterns across files
- Reusable UI components must live in `/components/ui`
- Use variants and composition instead of one-off styles
- Admin pages must use a shared layout component

## CMS Principles
- Routing is data-driven, not filesystem-driven
- Page Types are registered in code
- Page content is stored as structured JSON
- Admin UI consumes the same APIs as public features

## Database & Prisma
- SQLite for local development
- PostgreSQL compatibility required
- Use Prisma migrations for all schema changes
- Avoid database-specific assumptions in business logic

## Security
- Never trust client input
- Always enforce permissions server-side
- UI permission checks are secondary

## Extensibility
- Architecture must allow:
  - Additional roles
  - Additional property types
  - Additional page types
  - Workflow extensions
- No hardcoded logic blocking future growth

## Code Style
- Small, composable functions
- Clear naming over brevity
- Avoid deeply nested conditionals
- No side effects in render logic

## What NOT to do
- No direct Prisma calls in React components
- No hardcoded page types
- No hardcoded roles
- No UI logic mixed with domain logic