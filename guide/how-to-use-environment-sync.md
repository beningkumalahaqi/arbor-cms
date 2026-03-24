# How to Use Environment Sync

This guide walks through setting up and using Environment Sync to transfer CMS content between two Arbor CMS environments using secure API requests.

---

## Overview

Environment Sync lets you copy CMS content between environments.

Common use cases:

- **Staging → Production** — Push reviewed content to live
- **Production → Staging** — Pull live data for testing
- **Migration** — Transfer content to a new deployment
- **Backup workflows** — Keep a secondary environment synchronized

The sync transfers pages, widgets, page type settings, form types, form submissions, storage files/folders, and site settings (navigation/footer).

---

## Step 1: Prepare Both Environments

Before syncing:

1. Both environments must run the same Arbor CMS schema/migrations
2. Both environments must expose these routes:
   - `GET /api/environment-sync/pull`
   - `POST /api/environment-sync/push`
   - `GET /api/environment-sync/status`
3. Set `ENV_SYNC_TOKEN` on each environment

---

## Step 2: Configure Target API in Admin

1. Log in at `/admin`
2. Go to **Settings**
3. Open **Environment Sync** (`/admin/settings/environment-sync`)

Fill in:

- **Target Environment API URL**
  - Example: `https://target.example.com`
- **Target Environment API Token**
  - Must match `ENV_SYNC_TOKEN` on the target environment

Click **Save**.

---

## Step 3: Check Connection Status

1. Open `/admin/environment-sync`
2. Review the two status cards:

### Current Environment
- Always local database status for this instance

### Target Environment
- Connected if the target status endpoint responds and token is valid
- Disconnected if not configured, token is invalid, or endpoint is unreachable

If disconnected, verify API URL/token in settings and verify `ENV_SYNC_TOKEN` on target.

---

## Step 4: Run Sync

### Sync to Target Environment

Copies all content from current environment to target environment.

1. Click **Sync to Target Environment**
2. Confirm in dialog
3. Wait for completion
4. Review Sync Result counts

### Sync from Target Environment

Copies all content from target environment to current environment.

1. Click **Sync from Target Environment**
2. Confirm in dialog
3. Wait for completion
4. Review Sync Result counts

---

## Step 5: Review Result

Result card shows:

- Success/Failed status
- Message
- Counts for pages, widgets, page type settings, form types, form submissions, site settings, storage files, storage folders

---

## What Gets Synced

| Content Type | Synced | Notes |
|-------------|--------|-------|
| Pages | ✅ | Includes SEO and navigation fields |
| Widgets | ✅ | Includes parent/child container relationships |
| Page Type Settings | ✅ | Icon and allowed-children config |
| Form Types | ✅ | Form structures |
| Form Submissions | ✅ | Submission data (record-level failures are skipped) |
| Storage Folders | ✅ | Virtual folder structure |
| Storage Files | ✅ | Binary file data |
| Site Settings | ✅ | Navigation/footer only |
| User Accounts | ❌ | Never synced |
| Sync Credentials | ❌ | URL/token are not synchronized |

---

## Important Behavior

- Uses upsert by ID
- Prevents duplicates
- Maintains relationships through sync order
- Does not delete records that exist only in destination

---

## Troubleshooting

### Target shows disconnected

- Verify target API URL is correct and reachable
- Verify target token matches `ENV_SYNC_TOKEN`
- Verify target environment has latest code/routes

### Sync fails

- Check result message on `/admin/environment-sync`
- Verify both environments have matching migrations
- Verify token and network connectivity

### Data appears unchanged

- Confirm sync direction (`to` vs `from`)
- Remember sync is merge/upsert (not destructive replace)
- Verify records are published where applicable
