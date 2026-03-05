# Custom CMS Platform

This project is a structured and extensible Content Management System built with Next.js, TypeScript, Prisma, and Tailwind CSS.

It focuses on hierarchical content management, data-driven routing, and role-based administration without visual page builders or inline editing.

---

## Core Features

- Admin interface with a consistent UI system
- Hierarchical page tree with parent-child relationships
- Dynamic routing resolved from stored page paths
- Page Types defined in code and automatically registered
- Schema-based content properties
- Draft and published page states
- Role-based access control (SuperAdmin initially)

---

## Content Model

Pages are stored as structured data rather than being tied to the filesystem.

Each page:
- Belongs to a page tree
- Has a resolved URL path
- Uses a registered Page Type
- Stores content as validated structured properties

Page Types define:
- Allowed properties
- Validation rules
- Default values

---

## Admin Experience

The Admin UI is built using a shared set of reusable components styled with Tailwind CSS.

It allows:
- Managing the page tree
- Creating and editing pages through structured forms
- Selecting registered Page Types
- Publishing and unpublishing content

On first launch, the system requires creation of an initial SuperAdmin account.
After that, all administrative access is permission-based.

---

## Technology Overview

- Next.js (App Router)
- TypeScript
- Prisma ORM
- SQLite for local development
- PostgreSQL-ready schema
- Tailwind CSS for consistent UI styling

---

## Project Goals

- Predictable and maintainable content structure
- Consistent and reusable UI components
- Clear separation between content, routing, and rendering
- Extensible architecture for future growth

This project is designed as a CMS foundation rather than a visual website builder.