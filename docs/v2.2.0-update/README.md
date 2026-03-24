# v2.2.0 — Environment Sync API Upgrade

**Date:** March 24, 2026

---

## Summary

This update refactors the existing Environment Sync feature from direct database-to-database connections to secure API-based synchronization. The admin routes, settings routes, and environment sync UI remain unchanged, but synchronization now happens through authenticated HTTP requests (`pull` and `push`) between Arbor CMS environments.

---

## Changes

### 1. Environment Sync Transport Refactor

**Files:**
- `lib/sync/service.ts`
- `lib/environment-sync/sync.client.ts`

The sync service now:

- Builds a structured content payload from the local database
- Sends payloads to target `/api/environment-sync/push`
- Pulls payloads from target `/api/environment-sync/pull`
- Applies pulled payloads locally using the same upsert rules as before

Direct remote Prisma connections and temporary target DB clients were removed.

### 2. New API-Based Sync Endpoints

**Files:**
- `app/api/environment-sync/pull/route.ts`
- `app/api/environment-sync/push/route.ts`
- `app/api/environment-sync/status/route.ts`

Environment sync now uses:

- `GET /api/environment-sync/pull` — returns local sync payload
- `POST /api/environment-sync/push` — applies incoming payload locally
- `GET /api/environment-sync/status` — supports both:
  - admin status view (session-based)
  - remote token-auth connectivity checks

### 3. Token Authentication for Sync Transport

**File:** `app/api/environment-sync/auth.ts`

`pull`, `push`, and token-based `status` checks now require:

- `Authorization: Bearer <token>` header
- token to match `ENV_SYNC_TOKEN`

Invalid or missing token returns `401 Unauthorized`.

### 4. Settings UI Terminology Update

**Files:**
- `app/admin/settings/environment-sync/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/environment-sync/page.tsx`

UI labels were updated from database-oriented wording to API-oriented wording:

- “Target Environment Database” → “Target Environment API”
- “Environment Database URL” → “Target Environment API URL”
- “Environment Database Token” → “Target Environment API Token”

Existing settings storage fields are reused:

- `environmentDatabaseUrl`
- `environmentDatabaseToken`

No new settings system was introduced.

### 5. Site Settings API Hardening

**File:** `app/api/site-settings/route.ts`

- `GET /api/site-settings` now requires authenticated admin session
- `environmentDatabaseToken` is no longer returned to the frontend

This prevents sync token exposure in client-side responses.

---

## Migration

No database migration is required for v2.2.0.

To enable API sync:

1. Set `ENV_SYNC_TOKEN` in each environment
2. Configure **Target Environment API URL** in `/admin/settings/environment-sync`
3. Configure **Target Environment API Token** to match target `ENV_SYNC_TOKEN`
4. Use `/admin/environment-sync` as before

---

## Files

### New Files

- `lib/environment-sync/sync.client.ts`
- `app/api/environment-sync/auth.ts`
- `app/api/environment-sync/pull/route.ts`
- `app/api/environment-sync/push/route.ts`
- `docs/v2.2.0-update/README.md`

### Modified Files

- `lib/sync/service.ts`
- `app/api/environment-sync/route.ts`
- `app/api/environment-sync/status/route.ts`
- `app/api/site-settings/route.ts`
- `app/admin/environment-sync/page.tsx`
- `app/admin/settings/environment-sync/page.tsx`
- `app/admin/settings/page.tsx`
- `guide/how-environment-sync-works.md`
- `guide/how-to-use-environment-sync.md`
- `docs/README.md`
- `.github/copilot-instructions.md`
