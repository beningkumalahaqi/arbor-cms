# How to Use Environment Sync

This guide walks through setting up and using Environment Sync to transfer CMS content between two database environments. No code changes are needed — everything is done through the admin interface.

---

## Overview

Environment Sync lets you copy all CMS content between two Arbor CMS databases. Common use cases include:

- **Staging → Production** — Push reviewed content from staging to the live site
- **Production → Staging** — Pull live data into a staging environment for testing
- **Migration** — Transfer content to a new deployment
- **Backup & Restore** — Copy content to a secondary database as a backup

The sync transfers: pages, widgets, page type settings, form types, form submissions, storage files and folders, and site settings (navigation, footer).

---

## Step 1: Prepare the Target Database

Before syncing, make sure the target environment has:

1. **A running Arbor CMS database** with the same Prisma schema (run `npx prisma migrate dev` on the target)
2. **A reachable URL** — either a Turso/LibSQL cloud database or a local SQLite file
3. **An authentication token** (if using Turso or a remote database that requires auth)

The target database must have the same table structure as the current environment. Run migrations on both environments before syncing.

---

## Step 2: Configure the Target Environment

1. Log in to the admin panel at `/admin`
2. Go to **Settings** in the sidebar
3. Scroll down and click the **Environment Sync** card
4. You'll be taken to `/admin/settings/environment-sync`

Fill in the connection details:

- **Environment Database URL** — The URL of the target database
  - For Turso: `libsql://your-database-name-org.turso.io`
  - For local SQLite: `file:./path/to/database.db`
- **Environment Database Token** — The auth token for the target database (leave empty for local files)

Click **Save**. A confirmation message will appear.

---

## Step 3: Check Connection Status

1. Go to **Environment Sync** in the sidebar (or navigate to `/admin/environment-sync`)
2. The page shows two status cards:

### Current Environment
- Always shows **Connected** — this is the database the CMS is currently using
- Displays the (masked) database URL

### Target Environment
- Shows **Connected** if the target database is reachable and has the expected schema
- Shows **Disconnected** with an error message if the connection failed
- Common errors:
  - "Not configured" — no URL has been set in Settings
  - Connection timeout — the target URL is unreachable
  - Authentication error — the token is invalid or expired

If the target shows **Disconnected**, go back to Settings and verify the URL and token.

---

## Step 4: Sync Content

Once both environments show **Connected**, you can sync:

### Sync to Target Environment

Copies all content **from the current database to the target**.

1. Click **"Sync to Target Environment"**
2. A confirmation dialog appears warning that existing content in the target will be overwritten
3. Click **"Confirm Sync"**
4. Wait for the sync to complete (the button shows "Syncing...")
5. A result card appears showing success/failure and entity counts

### Sync from Target Environment

Copies all content **from the target database to the current**.

1. Click **"Sync from Target Environment"**
2. A confirmation dialog appears warning that existing content in the current environment will be overwritten
3. Click **"Confirm Sync"**
4. Wait for the sync to complete
5. A result card appears showing success/failure and entity counts

---

## Step 5: Review Sync Results

After a sync completes, a **Sync Result** card appears with:

- **Status badge** — "Success" (green) or "Failed" (red)
- **Message** — A description of what happened
- **Entity counts** — How many records were synced for each type:
  - Pages
  - Widgets
  - Page Type Settings
  - Form Types
  - Form Submissions
  - Site Settings
  - Storage Files
  - Storage Folders

If the sync failed, the message will describe the error. Common causes:
- Target database is unreachable
- Schema mismatch between environments
- Authentication token expired

---

## What Gets Synced

| Content Type | Synced | Notes |
|-------------|--------|-------|
| Pages | ✅ | All pages including content, status, navigation settings, SEO fields |
| Widgets | ✅ | All widgets including container nesting (section, columns) |
| Page Type Settings | ✅ | Icons and allowed children configuration |
| Form Types | ✅ | Form structure definitions |
| Form Submissions | ✅ | Individual form responses (skips on error) |
| Storage Folders | ✅ | Virtual folder structure |
| Storage Files | ✅ | File names, paths, and binary data |
| Site Settings | ✅ | Navigation and footer configuration only |
| User Accounts | ❌ | Users are managed per environment |
| Sync Credentials | ❌ | Target URL and token are never copied |

---

## How Sync Works

The sync uses **upsert by ID** for every record:

- If a record with the same ID exists in the destination → **update** it
- If no record with that ID exists → **create** it
- Records in the destination that don't exist in the source are **left untouched** (not deleted)

This means:
- Running sync multiple times is safe — it won't create duplicates
- Content is merged, not replaced
- The sync preserves all original record IDs

---

## Important Notes

### Before syncing
- **Both databases must have the same schema.** Run `npx prisma migrate dev` on both environments before syncing.
- **Sync is a full content transfer.** There is no selective sync — all entities of each type are synced.
- **Existing content is overwritten.** If a record with the same ID exists in the destination, it will be updated with the source's data.

### What sync does NOT do
- **Delete records** — Records that exist only in the destination are preserved
- **Sync user accounts** — Users and passwords are managed independently per environment
- **Copy environment credentials** — The target database URL and token are never transferred

### Best practices
- **Test on staging first** — Before syncing to production, verify the process works with a staging environment
- **Keep schemas in sync** — Always run the same migrations on both environments before syncing
- **Check the result** — Review the entity counts after sync to ensure all expected content was transferred
- **Use consistent IDs** — The sync matches records by ID, so avoid manually creating records with conflicting IDs in different environments

---

## Troubleshooting

### Target shows "Disconnected"
1. Verify the URL is correct in **Settings > Environment Sync**
2. Check that the target database is running and reachable
3. Verify the authentication token is valid (tokens may expire)
4. Ensure the URL starts with `libsql://`, `https://`, or `file:`

### Sync fails with an error
1. Check the error message in the Sync Result card
2. Common issues: network timeout, schema mismatch, invalid credentials
3. Verify both databases have the same Prisma migrations applied

### Some form submissions were skipped
- Form submission sync uses a try/catch per record
- Submissions that fail (e.g., referencing a non-existent FormType) are skipped
- Check the server console for logged error details

### Content appears unchanged after sync
- Remember that sync does not delete — if you're expecting records to be removed, they won't be
- Verify you synced in the correct direction ("to" vs "from")
- Check that the pages are published (sync preserves the original status)
