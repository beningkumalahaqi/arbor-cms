# How Environment Sync Works

This guide explains the architecture and data flow of the Arbor CMS Environment Sync feature — from how target environments are configured, to how content is transferred between environments through secure API requests.

---

## Architecture Overview

The Environment Sync system has four main components:

1. **Sync Service** — A server-side module that builds and applies sync payloads from the local database
2. **Sync Client** — A server-side HTTP client that calls remote sync endpoints with a Bearer token
3. **API Routes** — Endpoints for triggering sync operations, checking status, pulling payloads, and pushing payloads
4. **Admin UI** — Pages for configuration and operation

```
┌──────────────────────────────┐              HTTPS + Bearer Token             ┌──────────────────────────────┐
│ Current Arbor CMS Instance   │──────────────────────────────────────────────▶│ Target Arbor CMS Instance    │
│                              │                                               │                              │
│ /api/environment-sync        │                                               │ /api/environment-sync/push   │
│ /api/environment-sync/status │◀──────────────────────────────────────────────│ /api/environment-sync/pull   │
│ lib/sync/service.ts          │                                               │ /api/environment-sync/status │
│ lib/environment-sync/client  │                                               │ local Prisma DB              │
└──────────────────────────────┘                                               └──────────────────────────────┘
```

The key design principle: **Environment Sync only reads/writes the local database in each environment.** Data transfer across environments is done via API payloads, not direct database connections.

---

## Data Model

Environment sync settings are stored in the existing `SiteSettings` model:

| Field | Type | Description |
|-------|------|-------------|
| `environmentDatabaseUrl` | string | Base URL of the target Arbor CMS API |
| `environmentDatabaseToken` | string | Bearer token sent to the target environment |

These fields remain in the same model and are still excluded from synchronized content.

---

## Sync Service

**File:** `lib/sync/service.ts`

The sync service exports:

- `testConnection(targetApiUrl, targetApiToken)`
- `syncToTarget(source, targetApiUrl, targetApiToken)`
- `syncFromTarget(source, targetApiUrl, targetApiToken)`
- `buildSyncPayload(source)`
- `applySyncPayload(target, payload)`

### `buildSyncPayload(source)`
Collects local data into a JSON payload (including storage file bytes encoded as base64).

### `applySyncPayload(target, payload)`
Applies payload data to the local database using the same upsert strategy and sync order as previous versions.

### `syncToTarget(...)`
1. Build payload from local DB
2. `POST` payload to target `/api/environment-sync/push`
3. Return sync result with counts

### `syncFromTarget(...)`
1. `GET` payload from target `/api/environment-sync/pull`
2. Apply payload locally
3. Return sync result with counts

---

## Sync Order

Entities are applied in dependency-safe order:

1. SiteSettings (excluding environment sync credentials)
2. PageTypeSettings
3. Pages (ordered by `fullPath`)
4. Widgets (parents before children)
5. FormTypes
6. FormSubmissions (skip and continue on record errors)
7. StorageFolders
8. StorageFiles

This order preserves relationships and avoids duplicates.

---

## Authentication

Environment-to-environment sync transport uses token auth:

- Header: `Authorization: Bearer <token>`
- Token source: `SiteSettings.environmentSyncToken` (on receiving environment, generated from `/admin/settings/environment-sync`)

### Protected endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| `GET` | `/api/environment-sync/pull` | Bearer token (`environmentSyncToken`) |
| `POST` | `/api/environment-sync/push` | Bearer token (`environmentSyncToken`) |
| `GET` | `/api/environment-sync/status` | Bearer token (remote check) or admin session (UI status page) |

Invalid or missing token returns `401`.

---

## API Endpoints

### Admin-triggered endpoint

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/environment-sync` | Admin session | Triggers sync direction: `{ direction: "to" | "from" }` |

### Transport endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/environment-sync/pull` | Bearer token | Returns local content payload |
| `POST` | `/api/environment-sync/push` | Bearer token | Applies incoming payload to local DB |
| `GET` | `/api/environment-sync/status` | Bearer token or session | Connectivity check |

---

## Security Notes

- No direct remote DB connection is used
- Sync token is validated server-side only
- Sync token is not returned in `GET /api/site-settings`
- UI never receives or displays stored token values
- Sync credentials are still excluded from synced SiteSettings payload

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/sync/service.ts` | Build/apply payload logic and sync orchestration |
| `lib/environment-sync/sync.client.ts` | HTTP client for pull/push/status requests |
| `app/api/environment-sync/route.ts` | Admin trigger endpoint |
| `app/api/environment-sync/pull/route.ts` | Exposes local payload to authenticated remote environment |
| `app/api/environment-sync/push/route.ts` | Applies authenticated incoming payload |
| `app/api/environment-sync/status/route.ts` | Admin + token-auth status checks |
| `app/admin/environment-sync/page.tsx` | Sync UI page |
| `app/admin/settings/environment-sync/page.tsx` | Target API URL/token settings page |
