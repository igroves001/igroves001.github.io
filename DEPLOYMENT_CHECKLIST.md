# Deployment Checklist - GitHub Pages to Vercel

## Pre-Deployment Checklist

### ✅ Code Review Complete

**Serverless Functions:**
- [x] All 6 API functions created (`api/*.js`)
- [x] CORS handling implemented
- [x] OPTIONS preflight handling
- [x] Error handling in place
- [x] GitHub token read from environment variables

**Frontend Code:**
- [x] `scripts/rsvp.js` - Calls Vercel API
- [x] `scripts/admin.js` - Calls Vercel API
- [x] `scripts/config.js` - No token, only API_BASE_URL
- [x] All paths are relative (no hardcoded domains)
- [x] `guests.json` loaded directly for PIN validation (static file)

**Configuration:**
- [x] `vercel.json` created with proper routing
- [x] `CNAME` file exists (Vercel will use for custom domain)
- [x] `_config.yml` can stay (Vercel ignores it, no harm)

### ⚠️ Before Deploying to Vercel

1. **Create Vercel Account**
   - Go to vercel.com
   - Sign up with GitHub
   - Import repository: `igroves001/igroves001.github.io`

2. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `GITHUB_TOKEN` = your GitHub personal access token
   - (Optional) Add: `GITHUB_REPO` = `igroves001/igroves001.github.io`
   - (Optional) Add: `ALLOWED_ORIGIN` = `https://www.ianandjade.co.uk`

3. **Deploy**
   - Vercel will auto-deploy on first import
   - Or manually trigger deployment

4. **Configure Custom Domain**
   - Go to Settings → Domains
   - Add: `www.ianandjade.co.uk`
   - Follow DNS instructions from Vercel
   - Update DNS records as instructed

5. **Test Everything**
   - [ ] Visit site (should load normally)
   - [ ] Test PIN entry (loads guests.json)
   - [ ] Test RSVP submission (calls `/api/save-rsvp`)
   - [ ] Test admin panel login
   - [ ] Test adding a guest
   - [ ] Test editing a guest
   - [ ] Test deleting a guest
   - [ ] Test editing an RSVP
   - [ ] Test deleting an RSVP
   - [ ] Test CSV export

### 🔍 Things to Verify After Deployment

1. **API Endpoints Work**
   - Check Vercel function logs for any errors
   - Verify environment variables are set correctly
   - Test each endpoint manually if needed

2. **Static Files Load**
   - Images load correctly
   - Fonts load correctly
   - `data/guests.json` loads for PIN validation
   - `data/rsvps.json` loads for admin panel (via API)

3. **Custom Domain**
   - DNS propagated correctly
   - SSL certificate active (automatic with Vercel)
   - Both `www.ianandjade.co.uk` and `ianandjade.co.uk` work (if configured)

### 📝 Notes

- **GitHub Pages**: Can be disabled after Vercel is working
- **CNAME file**: Vercel will use it automatically
- **Static files**: All work the same on Vercel as on GitHub Pages
- **API functions**: Only work on Vercel (not on GitHub Pages)

### 🚨 If Something Breaks

1. Check Vercel function logs (Dashboard → Functions → View logs)
2. Check browser console for frontend errors
3. Verify environment variables are set
4. Check that custom domain DNS is correct
5. Test on Vercel's default domain first (your-project.vercel.app)

## Ready to Deploy! ✅

All code is ready. Just need to:
1. Set up Vercel account
2. Add environment variables
3. Deploy
4. Configure custom domain

