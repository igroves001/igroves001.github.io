// API base URL - will be set automatically by Vercel
// Make it available globally for other scripts
if (typeof window !== 'undefined') {
    window.API_BASE_URL = window.location.origin;
}

// Admin password (simple client-side check)
const ADMIN_PASSWORD = 'wedding2026';

