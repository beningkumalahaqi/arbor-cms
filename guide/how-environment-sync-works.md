# How Environment Sync Works

This guide explains the architecture and data flow of the Arbor CMS Environment Sync feature — from how target environments are configured, to how content is transferred between databases.

---

## Architecture Overview

The Environment Sync system has four main components:

1. **Sync Service** — A server-side module that handles database connections and content transfer
2. **Site Settings** — Stores target database credentials in the existing settings model
3. **API Routes** — Endpoints for triggering sync operations and checking connection status
4. **Admin UI** — Pages for configuration and operation

```
┌──────────────────┐                         ┌──────────────────┐
│  Current Env DB  │◀── Sync Service ──────▶│  Target Env DB   │
│  (this instance) │    (lib/sync/service)   │  (remote/other)  │
└──────────────────┘                         └──────────────────┘
        ▲                                            ▲
        │                                            │
        │ PrismaClient                    PrismaClient + LibSQL
        │ (lib/db.ts)                     (created per operation)
        │                                            │
┌───────┴──────────┐                     ┌───────────┴─────────┐
│  API Routes      │                     │  SiteSettings       │
│  /api/env-sync   │────── reads ───────▶│  environmentDB URL  │
│  /api/env-sync/  │                     │  environmentDB Token│
│    status        │                     └─────────────────────┘
└──────────────────┘
        ▲
        │ fetch()
┌───────┴──────────┐
│  Admin UI        │
│  /admin/env-sync │
│  /admin/settings │
│    /env-sync     │
└──────────────────┘
```

The key design principle: **The sync service uses the same Prisma schema for both environments.** Both databases must have identical table structures. The service creates a temporary PrismaClient for the target database, transfers data via upserts, then disconnects.

---

## Data Model

Environment sync credentials are stored in the existing `SiteSettings` model:

| Field | Type | Description |
|-------|------|-------------|
| `environmentDatabaseUrl` | string | LibSQL/Turso URL for the target database |
| `environmentDatabaseToken` | string | Authentication token (optional, for Turso/remote DBs) |

These fields are persisted alongside other site settings (navigation, footer, theme). They are **excluded from sync operations** to prevent credentials from being copied between environments.

---

## Sync Service

**File:** `lib/sync/service.ts`

The sync service is a standalone module that exports three functions:

### `testConnection(url, authToken)`

Tests whether a target database is reachable:

1. Creates a temporary PrismaClient with the LibSQL adapter
2. Attempts a simple read query (`siteSettings.findFirst()`)
3. Returns `{ connected: true }` on success or `{ connected: false, error: "..." }` on failure
4. Always disconnects the client in a `finally` block

### `syncToTarget(source, targetUrl, targetToken)`

Copies all CMS content **from the current environment to the target**:

1. Creates a temporary PrismaClient for the target database
2. Reads all data from the source (current) database
3. Upserts each record into the target database
4. Returns a `SyncResult` with counts of synced entities
5. Disconnects the target client

### `syncFromTarget(source, targetUrl, targetToken)`

Copies all CMS content **from the target environment to the current**:

Same process as `syncToTarget` but in reverse — reads from the target and writes to the current.

---

## Sync Order

Entities are synced in dependency-safe order to maintain referential integrity:

| Step | Entity | Strategy | Notes |
|------|--------|----------|-------|
| 1 | SiteSettings | Update or create | Excludes `environmentDatabaseUrl` and `environmentDatabaseToken` |
| 2 | PageTypeSettings | Upsert by ID | Icons and allowed children config |
| 3 | Pages | Upsert by ID | Ordered by `fullPath` ascending — parents synced before children |
| 4 | Widgets | Upsert by ID | Parent widgets first, then child widgets (container nesting) |
| 5 | FormTypes | Upsert by ID | Form structure definitions |
| 6 | FormSubmissions | Upsert by ID | Skips on error (logs but continues) |
| 7 | StorageFolders | Upsert by ID | Virtual folder paths |
| 8 | StorageFiles | Upsert by ID | File names, paths, and binary data |

### Why this order?

- **Pages before Widgets** — Widgets have a foreign key to Pages (`pageId`). Pages must exist before their widgets can be inserted.
- **Parent widgets before children** — Container widgets (Section, Columns) are synced first so child widgets can reference them via `parentId`.
- **FormTypes before FormSubmissions** — Submissions reference FormTypes via `formTypeId`. However, since this is a soft reference (no FK constraint), form submission failures are caught and logged rather than blocking the sync.
- **SiteSettings first** — No dependencies, establishes the base configuration.

---

## Upsert Strategy

All entities use **upsert by primary key (`id`)**:

```
For each entity record:
  → If a record with this ID exists in the target: UPDATE its fields
  → If no record with this ID exists: CREATE it with the original ID
```

This means:
- **No duplicate records** — IDs are preserved across environments
- **Updates are safe** — Running sync multiple times won't create extra data
- **Records are merged** — If the target has records not in the source, they are left untouched (not deleted)

### What is NOT synced

| Entity | Reason |
|--------|--------|
| `User` accounts | Security — users and passwords should be managed per environment |
| `environmentDatabaseUrl` | Prevents credential leaking between environments |
| `environmentDatabaseToken` | Prevents credential leaking between environments |

### What happens to extra records

The sync uses upsert, not replace. If the target database has records that don't exist in the source:
- They are **not deleted** during sync
- This is by design — it prevents accidental data loss
- To fully replace a target's content, you would need to clear the target first (not supported via the UI)

---

## Target Database Client

The sync service creates a temporary PrismaClient for the target database using the `@prisma/adapter-libsql` adapter:

```typescript
function createTargetClient(url: string, authToken?: string): PrismaClient {
  validateUrl(url);
  const adapter = new PrismaLibSql({
    url,
    authToken: authToken || undefined,
  });
  return new PrismaClient({ adapter });
}
```

**URL validation** restricts connections to these protocols:
- `libsql://` — Turso/LibSQL remote databases
- `https://` — HTTPS database endpoints
- `file:` — Local SQLite files (for testing)

The client is always disconnected after the operation completes via a `finally` block, even if the sync fails.

---

## API Endpoints

### Sync Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/environment-sync` | Required | Trigger a sync operation (`{ direction: "to" \| "from" }`) |
| `GET` | `/api/environment-sync/status` | Required | Get connection status for both environments |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/site-settings` | Public | Returns all settings including environment sync fields |
| `PUT` | `/api/site-settings` | Required | Updates settings including `environmentDatabaseUrl` and `environmentDatabaseToken` |

---

## Error Handling

### Connection failures
- `testConnection()` catches all errors and returns `{ connected: false, error: message }`
- The admin UI shows the error message in the Target Environment status card

### Sync failures
- If any entity sync fails (except FormSubmissions), the entire sync is aborted and returns `{ success: false, message: "..." }`
- FormSubmission failures are logged individually but don't stop the overall sync
- The admin UI shows the failure message in the Sync Result card

### URL validation
- Invalid URLs (wrong protocol, empty string) are rejected before any connection is attempted
- Accepted protocols: `libsql://`, `https://`, `file:`

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/sync/service.ts` | Sync service with connection testing and bidirectional sync logic |
| `app/api/environment-sync/route.ts` | POST endpoint for triggering sync operations |
| `app/api/environment-sync/status/route.ts` | GET endpoint for checking environment connection status |
| `app/admin/environment-sync/page.tsx` | Admin page with status cards and sync action buttons |
| `app/admin/settings/environment-sync/page.tsx` | Settings page for target database URL and token |
| `app/admin/settings/page.tsx` | Main settings page with Environment Sync link card |
| `components/admin/admin-shell.tsx` | Admin sidebar with Environment Sync navigation entry |
| `prisma/schema.prisma` | SiteSettings model with environment sync fields |
