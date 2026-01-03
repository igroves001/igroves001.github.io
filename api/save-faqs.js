// Vercel serverless function to save FAQs to GitHub

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        const { faqsData } = req.body;

        if (!Array.isArray(faqsData)) {
            return res.status(400).json({ error: 'Invalid FAQs data: must be an array' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO || 'igroves001/igroves001.github.io';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        // Import helper function
        const { ensureDataBranch } = await import('./github-helpers.js');

        // Ensure data branch exists and get auth header
        let authHeader;
        try {
            authHeader = await ensureDataBranch(GITHUB_TOKEN, GITHUB_REPO);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }

        // Get current file to get SHA
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/faqs.json?ref=data`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sha = null;
        if (fileResponse.ok) {
            const file = await fileResponse.json();
            sha = file.sha;
        }

        // Write back to GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/faqs.json?ref=data`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Updated FAQs',
                    content: Buffer.from(JSON.stringify(faqsData, null, 2)).toString('base64'),
                    sha: sha,
                    branch: 'data'
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return res.status(updateResponse.status).json({ 
                error: error.message || 'Failed to save FAQs' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'FAQs saved successfully' 
        });

    } catch (error) {
        console.error('Error saving FAQs:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

