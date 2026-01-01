# RSVP System Setup Guide

## Initial Setup

### 1. Vercel Setup

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Import your repository (`igroves001/igroves001.github.io`)
3. Go to **Settings** → **Environment Variables**
4. Add `GITHUB_TOKEN` with your GitHub personal access token
5. (Optional) Add `GITHUB_REPO` as `igroves001/igroves001.github.io`
6. (Optional) Add `ALLOWED_ORIGIN` as your domain (e.g., `https://www.ianandjade.co.uk`)
7. Deploy the project

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Give it a name like "Wedding RSVP System"
4. Set expiration (or no expiration)
5. Select repository: `igroves001/igroves001.github.io`
6. Under "Repository permissions" → "Contents" → Set to **Read and Write**
7. Generate token and copy it
8. Add it to Vercel environment variables (see step 1 above)

**Note:** The token is stored in Vercel, NOT in the repository. This prevents GitHub from blocking it.

### 3. Admin Password

1. Open `scripts/config.js`
2. Change `ADMIN_PASSWORD` to your desired password (default is 'wedding2026')

### 4. Add Guests

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

### 5. Generate QR Codes

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
   - Submits RSVP (saved to `data/rsvps.json` via Vercel serverless function → GitHub API)

2. **Admin Panel:**
   - Visit `/admin.html`
   - Enter admin password
   - View all RSVPs with stats
   - Edit/delete RSVPs
   - Add/edit/delete guests
   - Search functionality
   - Export to CSV

3. **Backend (Vercel):**
   - Serverless functions handle all GitHub API calls
   - Token stored securely in Vercel environment variables
   - Functions located in `/api/*` directory

## File Structure

```
/
├── api/                  # Vercel serverless functions
│   ├── save-rsvp.js
│   ├── get-rsvps.js
│   ├── save-guest.js
│   ├── get-guests.js
│   ├── delete-rsvp.js
│   └── delete-guest.js
├── data/
│   ├── guests.json      # Guest list with PINs
│   └── rsvps.json       # RSVP responses
├── scripts/
│   ├── config.js        # Repo info & admin password (no token!)
│   ├── rsvp.js          # PIN validation & RSVP form
│   └── admin.js         # Admin panel functionality
├── vercel.json          # Vercel configuration
├── index.html           # Main site with RSVP section
└── admin.html           # Admin panel
```

## Important Notes

- **GitHub token is stored in Vercel environment variables** (never in the repository)
- Guest data in `guests.json` is publicly visible (this is fine for your use case)
- RSVP data in `rsvps.json` is publicly visible (this is fine for your use case)
- All data is stored in your GitHub repo as JSON files
- The admin panel password is client-side only (not secure, but fine for wedding RSVP)
- Vercel functions handle all GitHub API calls server-side

## Troubleshooting

**RSVP submission fails:**
- Check Vercel function logs in dashboard
- Verify `GITHUB_TOKEN` environment variable is set in Vercel
- Ensure token has `Contents: Read and Write` permission
- Check browser console for errors

**PIN not found:**
- Verify guest exists in `data/guests.json`
- Check PIN is exactly 4 digits
- Ensure JSON file is valid

**Admin panel not loading:**
- Check admin password in `scripts/config.js`
- Ensure Vercel functions are deployed
- Check browser console for errors
- Verify API endpoints are accessible

**Vercel deployment issues:**
- Check Vercel dashboard for build errors
- Verify environment variables are set
- Check function logs for runtime errors

