# Project Coding Instructions

This project is a custom CMS built with Next.js App Router, TypeScript, and Prisma.

## General Rules
- Prefer explicit, readable code over clever abstractions
- No business logic in UI components
- No database access outside Prisma
- All mutations must be validated server-side

## Architecture
- Next.js App Router only
- Server Components by default
- Client Components only when required
- API routes handle mutations and authentication
- Prisma is the single source of truth for database access

## CMS Principles
- Routing is data-driven, not filesystem-driven
- Page Types are registered in code
- Page content is stored as structured JSON
- Admin UI consumes the same APIs as public features

## Database & Prisma
- SQLite for local development
- PostgreSQL compatibility required
- No raw SQL unless absolutely necessary
- Use Prisma migrations for all schema changes
- Avoid database-specific behavior in business logic

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
- No hardcoded logic that blocks future growth

## Code Style
- Clear naming over brevity
- Small, composable functions
- Avoid deeply nested conditionals
- Avoid side effects in render logic

## What NOT to do
- No direct Prisma calls in React components
- No hardcoded page types
- No hardcoded roles
- No duplicated authorization logic