# Vercel Setup Instructions

## Overview
The RSVP system now uses Vercel serverless functions to handle GitHub API calls. The GitHub token is stored as an environment variable in Vercel (never in the repository).

## Setup Steps

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Import your repository (`igroves001/igroves001.github.io`)

### 2. Configure Environment Variables
1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

   **Required:**
   - `GITHUB_TOKEN` - Your GitHub personal access token (fine-grained or classic)
   - `GITHUB_REPO` - `igroves001/igroves001.github.io` (optional, defaults to this)

   **Optional:**
   - `ALLOWED_ORIGIN` - Your domain (e.g., `https://www.ianandjade.co.uk`) for CORS. Defaults to `*` if not set.

### 3. Deploy
1. Vercel will auto-deploy when you push to GitHub
2. Or manually trigger a deployment from the Vercel dashboard
3. Your site will be available at `your-project.vercel.app`

### 4. Configure Custom Domain (Optional)
1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain (`www.ianandjade.co.uk`)
3. Update DNS records as instructed by Vercel
4. Update `CNAME` file if needed

## GitHub Token Requirements

Your GitHub token needs:
- **Scope**: `repo` (for classic tokens) or **Contents: Read and Write** (for fine-grained tokens)
- **Repository Access**: Must have access to `igroves001/igroves001.github.io`

## API Endpoints

All endpoints are at `/api/*`:
- `POST /api/save-rsvp` - Save/update RSVP
- `GET /api/get-rsvps` - Get all RSVPs
- `POST /api/save-guest` - Save/update guest
- `GET /api/get-guests` - Get all guests
- `DELETE /api/delete-rsvp` - Delete RSVP
- `DELETE /api/delete-guest` - Delete guest

## Testing

1. After deployment, test the RSVP form:
   - Visit your site
   - Enter a PIN
   - Submit an RSVP
   - Check that it appears in the admin panel

2. Test the admin panel:
   - Visit `/admin.html`
   - Enter password
   - Try adding/editing/deleting guests
   - Try editing/deleting RSVPs

## Troubleshooting

**RSVP submission fails:**
- Check Vercel function logs in dashboard
- Verify `GITHUB_TOKEN` environment variable is set
- Check token has correct permissions

**Admin panel can't load data:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check Vercel function logs

**CORS errors:**
- Set `ALLOWED_ORIGIN` environment variable to your domain
- Or leave it as `*` for development (less secure)

## File Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── save-rsvp.js
│   ├── get-rsvps.js
│   ├── save-guest.js
│   ├── get-guests.js
│   ├── delete-rsvp.js
│   └── delete-guest.js
├── vercel.json            # Vercel configuration
├── scripts/
│   ├── config.js          # No token here anymore!
│   ├── rsvp.js            # Calls Vercel API
│   └── admin.js           # Calls Vercel API
└── ... (rest of files)
```

## Benefits

✅ Token never in repository (GitHub won't block it)
✅ Guests can RSVP without needing the token
✅ Admin panel works the same way
✅ Still uses GitHub for storage (JSON files)
✅ Free tier is generous (100k requests/month)
✅ Auto-deploys on git push

