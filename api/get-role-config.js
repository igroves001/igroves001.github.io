// Vercel serverless function to get role configuration from GitHub

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    try {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO || 'igroves001/igroves001.github.io';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        // Get authorization header
        const authHeader = GITHUB_TOKEN.startsWith('github_pat_') 
            ? `Bearer ${GITHUB_TOKEN}` 
            : `token ${GITHUB_TOKEN}`;

        // Get file from GitHub
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/role-config.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (fileResponse.status === 404) {
            // File doesn't exist yet - return default config
            return res.status(200).json({
                sections: {
                    intro: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    venue: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    dresscode: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    schedule: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    faq: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    rsvp: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
                },
                faqQuestions: {
                    parking: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                    accommodation: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: false },
                    carriages: { day_guest_staying: false, day_guest_not_staying: true, evening_guest: true },
                    taxi: { day_guest_staying: false, day_guest_not_staying: true, evening_guest: true },
                    gifts: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true },
                    children: { day_guest_staying: true, day_guest_not_staying: true, evening_guest: true }
                }
            });
        }

        if (!fileResponse.ok) {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read role config file' 
            });
        }

        const file = await fileResponse.json();
        const roleConfig = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

        return res.status(200).json(roleConfig);

    } catch (error) {
        console.error('Error getting role config:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

