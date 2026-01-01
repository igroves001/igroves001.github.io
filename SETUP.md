# RSVP System Setup Guide

## Initial Setup

### 1. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Wedding RSVP System"
4. Select scope: `repo` (Full control of private repositories)
5. Generate token and copy it
6. Open `scripts/config.js` and replace `YOUR_GITHUB_TOKEN_HERE` with your token

### 2. Admin Password

1. Open `scripts/config.js`
2. Change `ADMIN_PASSWORD` to your desired password (default is 'wedding2026')

### 3. Add Guests

You can add guests in two ways:

**Option A: Via Admin Panel (Recommended)**
1. Visit `yoursite.com/admin.html`
2. Enter admin password
3. Go to "Guests" tab
4. Click "Add Guest"
5. Enter PIN (4 digits), Name, and whether they have a room
6. Save

**Option B: Manually Edit JSON**
1. Open `data/guests.json`
2. Add guest objects:
```json
[
  {
    "pin": "1234",
    "name": "John & Jane Smith",
    "has_room": true
  },
  {
    "pin": "5678",
    "name": "Alice Johnson",
    "has_room": false
  }
]
```
3. Commit and push to GitHub

### 4. Generate QR Codes

For each guest, generate a QR code (using any QR code generator) that links to:
```
https://www.ianandjade.co.uk/rsvp?pin=XXXX
```
Replace `XXXX` with the guest's 4-digit PIN.

## How It Works

1. **Guest Flow:**
   - Guest scans QR code or visits site
   - Enters 4-digit PIN
   - Sees personalized RSVP form with their name
   - If they have a room allocated, a message is shown
   - Submits RSVP (saved to `data/rsvps.json` via GitHub API)

2. **Admin Panel:**
   - Visit `/admin.html`
   - View all RSVPs with stats
   - Edit/delete RSVPs
   - Add/edit/delete guests
   - Search functionality
   - Export to CSV

## File Structure

```
/
├── data/
│   ├── guests.json      # Guest list with PINs
│   └── rsvps.json       # RSVP responses
├── scripts/
│   ├── config.js        # GitHub token & admin password
│   ├── rsvp.js          # PIN validation & RSVP form
│   └── admin.js         # Admin panel functionality
├── index.html           # Main site with RSVP section
└── admin.html           # Admin panel
```

## Important Notes

- The GitHub token is visible in the JavaScript source code (this is fine for your use case)
- Guest data in `guests.json` is publicly visible (this is fine for your use case)
- RSVP data in `rsvps.json` is publicly visible (this is fine for your use case)
- All data is stored in your GitHub repo as JSON files
- The admin panel password is client-side only (not secure, but fine for wedding RSVP)

## Troubleshooting

**RSVP submission fails:**
- Check that GitHub token is correct in `scripts/config.js`
- Ensure token has `repo` scope
- Check browser console for errors

**PIN not found:**
- Verify guest exists in `data/guests.json`
- Check PIN is exactly 4 digits
- Ensure JSON file is valid

**Admin panel not loading:**
- Check admin password in `scripts/config.js`
- Ensure `data/rsvps.json` and `data/guests.json` exist
- Check browser console for errors

