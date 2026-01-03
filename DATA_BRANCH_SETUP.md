# Data Branch Setup Instructions

## Overview

The JSON data files (`guests.json`, `rsvps.json`, `faqs.json`, `role-config.json`) are stored in a separate GitHub branch called `data` to prevent Vercel from triggering rebuilds when data changes. This document explains how to set up and manage the data branch.

## Initial Setup

### Option 1: Automatic Creation (Recommended)

The `data` branch will be automatically created when the first API write operation happens. Simply use the application normally - when a guest submits an RSVP or you add/edit a guest through the admin panel, the branch will be created automatically.

### Option 2: Manual Creation

If you prefer to create the branch manually before deploying:

1. **Create and switch to the data branch:**
   ```bash
   git checkout -b data
   ```

2. **Ensure only data files are in this branch:**
   - The branch should contain only the `data/` directory with JSON files
   - Remove any other files if they exist

3. **Commit and push the data files:**
   ```bash
   git add data/
   git commit -m "Initial data branch setup"
   git push origin data
   ```

4. **Switch back to main branch:**
   ```bash
   git checkout main
   ```

## Moving Existing Data to the Data Branch

If you have existing data in the main branch that needs to be moved:

1. **Create the data branch from main:**
   ```bash
   git checkout -b data
   ```

2. **Remove all non-data files (keep only data/ directory):**
   ```bash
   # Remove everything except data directory
   git rm -r --cached .
   git add data/
   git commit -m "Move data files to data branch"
   git push origin data
   ```

3. **Switch back to main:**
   ```bash
   git checkout main
   ```

4. **Optionally remove data files from main branch:**
   ```bash
   # This is optional - the files in main won't be used by the API
   git rm -r data/
   git commit -m "Remove data files from main branch (now in data branch)"
   git push origin main
   ```

## Verifying the Setup

1. **Check that the data branch exists:**
   ```bash
   git branch -a | grep data
   ```

2. **Verify data files are in the branch:**
   ```bash
   git checkout data
   ls -la data/
   # Should see: guests.json, rsvps.json, faqs.json, role-config.json
   git checkout main
   ```

3. **Test the API:**
   - Visit your site and try submitting an RSVP
   - Check the Vercel function logs to ensure no errors
   - Verify the data is being read/written correctly

## How It Works

- **API Functions**: All API functions now use `?ref=data` in GitHub API URLs to read/write from the `data` branch
- **Vercel Deployment**: Vercel only watches the `main` branch, so changes to the `data` branch won't trigger rebuilds
- **Automatic Branch Creation**: If the `data` branch doesn't exist, GitHub will create it automatically on the first write operation

## Managing Data

### Viewing Data

You can view the data files directly on GitHub:
- Navigate to your repository
- Switch to the `data` branch using the branch selector
- Browse the `data/` directory

### Editing Data Manually

If you need to edit data files manually:

1. **Checkout the data branch:**
   ```bash
   git checkout data
   ```

2. **Edit the JSON files:**
   ```bash
   # Edit files in data/ directory
   nano data/guests.json
   ```

3. **Commit and push:**
   ```bash
   git add data/
   git commit -m "Updated guest data"
   git push origin data
   ```

4. **Switch back to main:**
   ```bash
   git checkout main
   ```

### Backup and Restore

Since data is in a git branch, you can use standard git operations:

- **Backup**: The entire git history is your backup
- **Restore**: Use `git checkout` to restore from any commit
- **View history**: `git log data/` to see all data changes

## Troubleshooting

### Branch doesn't exist error

If you get errors about the branch not existing:
1. The branch should be created automatically on first write
2. If it doesn't, manually create it using Option 2 above
3. Ensure your GitHub token has permission to create branches

### Data not updating

If changes aren't appearing:
1. Verify the API functions have `?ref=data` in their URLs
2. Check Vercel function logs for errors
3. Ensure the GitHub token has write permissions
4. Verify the branch name is exactly `data` (case-sensitive)

### Vercel still rebuilding

If Vercel is still triggering rebuilds:
1. Verify Vercel is configured to watch only the `main` branch
2. Check Vercel project settings → Git → Production Branch
3. Ensure no webhooks are configured for the `data` branch

## Important Notes

- The `data` branch should **only** contain data files (JSON files in the `data/` directory)
- Code changes should always be made in the `main` branch
- The API functions will automatically create the `data` branch if it doesn't exist
- All data operations (read/write) now go through the `data` branch
- The files in the `main` branch's `data/` directory (if they exist) are no longer used by the API

