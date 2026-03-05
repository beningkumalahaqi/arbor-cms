# Arbor CMS

A lightweight, structured Content Management System designed for developers who want full control over their content architecture.

Built with Next.js, TypeScript, Prisma, and Tailwind CSS.

---

## What is Arbor CMS?

Arbor CMS organizes content as a hierarchical page tree — similar to how files are structured in folders. Each page has a type, a position in the tree, and structured content fields. There are no drag-and-drop builders or inline editors. Everything is managed through clean, form-based admin screens.

Public URLs are generated directly from the page tree. When a visitor requests a URL, the system looks up the matching page, checks that it's published, and renders it. No manual route configuration needed.

---

## Key Concepts

### Page Tree
All pages live in a tree structure. Pages can be nested under other pages to create natural URL hierarchies like `/about`, `/about/team`, or `/blog/2026/hello-world`. The admin panel displays pages as a collapsible tree with icons, making it easy to visualize your content hierarchy.

### Page Types
Every page has a type (e.g., "Home", "Content") that determines what fields it has. Page Types are defined in code and automatically picked up by the system. The Home page type is special — only one can exist, and it always serves the root URL `/`. A Home page is automatically created when you set up your first admin account.

### Page Type Settings
Each page type can be configured through the admin UI with:
- **Icon** — Choose from a curated icon set to visually distinguish page types in the tree view.
- **Allowed Children** — Restrict which page types can be created as children under a given type.

These settings are managed entirely through the admin interface — no code changes required.

### Properties
Properties are the content fields within a page — things like title, description, or body text. Each Page Type declares which properties it uses, what type they are (text, rich text, etc.), and whether they're required. This keeps content structured and validated.

### Admin Panel
A clean, consistent admin interface at `/admin` lets you manage pages, view registered page types, configure page type settings, and publish content. On first launch, you'll set up an initial administrator account — a Home page is created automatically so you can start building immediately.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Prisma ORM — SQLite locally, PostgreSQL-ready |
| Styling | Tailwind CSS |
| Auth | Cookie-based sessions, bcrypt password hashing |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

On first visit, you'll be redirected to `/setup` to create your SuperAdmin account. A Home page is automatically created during setup. After that, head to `/admin` to start building your page tree.

---

## Project Structure

```
app/              → Pages and API routes (Next.js App Router)
  admin/          → Admin UI (protected)
  api/            → REST endpoints for mutations
  [[...slug]]/    → Catch-all public page routing
components/
  ui/             → Shared, reusable UI components
  admin/          → Admin-specific components (sidebar, page tree)
lib/
  auth/           → Authentication and session management
  page-types/     → Page Type definitions and registry
  page-template/  → Page Template components and registry
  properties/     → Property validation and defaults
  icons.ts        → Curated SVG icon set for page types
prisma/           → Database schema and migrations
docs/             → Release notes and documentation
guide/            → Developer guides for extending the CMS
```

---

## Guides

- [How to Create a New Page Type](guide/how-to-create-a-new-page-type.md)
- [How to Create New Properties](guide/how-to-create-new-properties.md)

---

## License

Private project.

This project is designed as a CMS foundation rather than a visual website builder.