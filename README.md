<p align="center">
  <img src="public/Arbor.png" alt="Arbor CMS" width="120" />
</p>

# Arbor CMS

A lightweight, structured Content Management System designed for developers who want full control over their content architecture.

Built with Next.js, TypeScript, Prisma, Tailwind CSS, and shadcn/ui.

---

## What is Arbor CMS?

Arbor CMS organizes content as a hierarchical page tree — similar to how files are structured in folders. Each page has a type, a position in the tree, and structured content fields. There are no drag-and-drop builders or inline editors. Everything is managed through clean, form-based admin screens.

Public URLs are generated directly from the page tree. When a visitor requests a URL, the system looks up the matching page, checks that it's published, and renders it. No manual route configuration needed.

---

## Key Concepts

### Page Tree
All pages live in a tree structure. Pages can be nested under other pages to create natural URL hierarchies like `/about`, `/about/team`, or `/blog/2026/hello-world`. The admin panel displays pages as a collapsible tree with icons, making it easy to visualize your content hierarchy.

### Page Types
Every page has a type (e.g., "Home", "Content", "Article") that determines what fields it has. Page Types are defined in code and automatically picked up by the system. The Home page type is special — only one can exist, and it always serves the root URL `/`. A Home page is automatically created when you set up your first admin account.

### Page Type Settings
Each page type can be configured through the admin UI with:
- **Icon** — Choose from a curated icon set to visually distinguish page types in the tree view.
- **Allowed Children** — Restrict which page types can be created as children under a given type.

These settings are managed entirely through the admin interface — no code changes required.

### Properties
Properties are the content fields within a page — things like title, description, or body text. Each Page Type declares which properties it uses, what type they are (text, rich text, image, etc.), and whether they're required. This keeps content structured and validated.

### File Management
Arbor CMS includes a built-in file manager accessible from the admin panel. Upload, organize, rename, and delete files in a hierarchical folder structure. Files and folders are stored in the database as binary blobs, making storage fully portable and persistent across deployments — no local filesystem or external storage service required. When pages are created, corresponding folders are auto-created for organizational convenience. The image property type integrates with the file manager via a visual selector modal.

The file explorer supports **drag-and-drop** to move files and folders between directories, and **sortable columns** — click any column header (Name, Size, Date Added, Modified) to sort, and click again to toggle ascending/descending order. Arrow indicators show the current sort direction.

### Rich Text Editor
Rich text properties use a full WYSIWYG editor powered by TipTap. The editor supports bold, italic, underline, strikethrough, headings, font sizes, text color, bullet/ordered lists, text alignment, blockquotes, code blocks, and horizontal rules. A raw HTML mode toggle lets you view and edit the underlying HTML directly, with changes syncing between modes. The editor area has a capped max-height and scrolls when content is large, keeping the form layout manageable.

### Page Editor with Live Preview
When editing a page, the admin shows a split-pane layout: the edit form on the left and a live preview on the right. The preview renders using the same page templates as the public site, updating in real time as you type. A draggable divider between the panels lets you adjust the split to your preference (20%–80%). You can toggle the preview on or off, and a "View Live" link opens the published page in a new tab.

### Theme System
Arbor CMS has a dual-theme system that lets you control the admin interface and live site appearance independently. From **Settings > Theme**, you can choose between Auto, Light, or Dark for both:
- **CMS Admin** — Applies to the admin panel, login, and setup pages.
- **Live Site** — Applies to all public-facing pages.

Auto follows your operating system preference. Themes are persisted in localStorage and apply instantly without page flicker thanks to an inline script that runs before React hydrates.

### Site Navigation
The live site includes a responsive navigation bar that displays top-level published pages. Navigation is configured through the Settings page:
- **Enable/disable** the navigation bar globally.
- **Site title** — text shown next to the logo.
- **Logo image** — selected from the built-in file manager.

Per-page control is available in the page editor for top-level pages:
- **Show in Navigation** — toggle whether the page appears in the nav bar.
- **Navigation Label** — custom display label (defaults to Title Case of the slug).

Only top-level pages (not nested children) can appear in the navigation. On mobile, the nav collapses into a hamburger menu that opens a side panel overlay.

### Site Footer
A standard footer is rendered on all public pages with:
- **Logo image** — selected from the file manager.
- **Footer text** — displayed alongside an automatic copyright year.
- **Enable/disable** toggle in Settings.

### Admin Panel
A clean, consistent admin interface at `/admin` lets you manage pages, view registered page types, configure page type settings, adjust theme preferences, configure navigation and footer, and publish content. The sidebar is collapsible — click the chevron to shrink it to icon-only mode for more workspace. On first launch, you'll set up an initial administrator account — a Home page is created automatically so you can start building immediately.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Prisma ORM with libSQL adapter (SQLite-compatible, Turso-ready) |
| UI Components | shadcn/ui (Radix primitives, class-variance-authority) |
| Styling | Tailwind CSS with CSS variable design tokens (lime theme, oklch) |
| Icons | Phosphor Icons |
| Auth | Cookie-based sessions, bcrypt password hashing |
| Rich Text | TipTap (ProseMirror) |

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
    files/        → File manager page
  api/            → REST endpoints for mutations
    storage/      → File management API
  [[...slug]]/    → Catch-all public page routing
components/
  ui/             → Shared UI components (shadcn/ui-based: Button, Input, Card, Badge, Dialog, etc.)
  admin/          → Admin-specific components (sidebar, page tree, page preview, file explorer, rich text editor)
  site/           → Live site components (navigation bar, footer, site layout wrapper)
  theme-provider  → Dual-theme context provider (admin + live site)
lib/
  auth/           → Authentication and session management
  page-types/     → Page Type definitions and registry
  page-template/  → Page Template components and registry
  properties/     → Property validation and defaults
  icons.ts        → Curated SVG icon set for page types
  utils.ts        → Utility functions (cn class merger for shadcn/ui)
  storage/        → Database-backed file storage (types, DB operations, index)
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