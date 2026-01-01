// GitHub API Configuration
// Note: GitHub token is now stored in Vercel environment variables
// This file only contains repo information
const GITHUB_REPO = 'igroves001/igroves001.github.io';
const GITHUB_OWNER = 'igroves001';

// API base URL - will be set automatically by Vercel
// Make it available globally for other scripts
if (typeof window !== 'undefined') {
    window.API_BASE_URL = window.location.origin;
    window.GITHUB_REPO = GITHUB_REPO;
}

// Admin password (simple client-side check)
const ADMIN_PASSWORD = 'wedding2026';

