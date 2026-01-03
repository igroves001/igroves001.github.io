// Vercel serverless function to delete RSVP from GitHub

export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
        res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow DELETE
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');

    try {
        const { pin, submitted_at } = req.query;

        if (!pin) {
            return res.status(400).json({ error: 'PIN is required' });
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

        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json?ref=data`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (fileResponse.status === 404) {
            // File doesn't exist yet - nothing to delete
            return res.status(404).json({ error: 'RSVP not found' });
        }

        if (!fileResponse.ok) {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read RSVPs file' 
            });
        }

        const file = await fileResponse.json();
        const currentRsvps = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

        // Find and remove RSVP
        const index = currentRsvps.findIndex(r => 
            r.pin === pin && (!submitted_at || r.submitted_at === submitted_at)
        );

        if (index === -1) {
            return res.status(404).json({ error: 'RSVP not found' });
        }

        currentRsvps.splice(index, 1);

        // Write back to GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/rsvps.json?ref=data`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Deleted RSVP',
                    content: Buffer.from(JSON.stringify(currentRsvps, null, 2)).toString('base64'),
                    sha: file.sha,
                    branch: 'data'
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return res.status(updateResponse.status).json({ 
                error: error.message || 'Failed to delete RSVP' 
            });
        }

        return res.status(200).json({ success: true, message: 'RSVP deleted' });

    } catch (error) {
        console.error('Error deleting RSVP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

