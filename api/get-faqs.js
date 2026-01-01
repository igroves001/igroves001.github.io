// Vercel serverless function to get all FAQs from GitHub

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
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/faqs.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (fileResponse.status === 404) {
            // File doesn't exist yet - return empty array
            return res.status(200).json([]);
        }

        if (!fileResponse.ok) {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read FAQs file' 
            });
        }

        const file = await fileResponse.json();
        const faqs = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

        // Sort by order
        faqs.sort((a, b) => (a.order || 0) - (b.order || 0));

        return res.status(200).json(faqs);

    } catch (error) {
        console.error('Error getting FAQs:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

