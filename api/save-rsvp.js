// Vercel serverless function to save/update RSVP to GitHub

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
        const { rsvpData } = req.body;

        if (!rsvpData || !rsvpData.pin) {
            return res.status(400).json({ error: 'Invalid RSVP data' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO || 'igroves001/igroves001.github.io';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        // Get authorization header (supports both classic and fine-grained tokens)
        const authHeader = GITHUB_TOKEN.startsWith('github_pat_') 
            ? `Bearer ${GITHUB_TOKEN}` 
            : `token ${GITHUB_TOKEN}`;

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

        let currentRsvps = [];
        let sha = null;

        if (fileResponse.ok) {
            const file = await fileResponse.json();
            currentRsvps = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
            sha = file.sha;
        } else if (fileResponse.status === 404) {
            // File doesn't exist yet - create it
            sha = null;
        } else {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read RSVPs file' 
            });
        }

        // Clean up old format fields if present (migration)
        if (rsvpData.guests_count !== undefined) {
            delete rsvpData.guests_count;
        }
        if (rsvpData.dietary_requirements !== undefined && rsvpData.attending_guests) {
            // Only remove old dietary_requirements if we have the new format
            delete rsvpData.dietary_requirements;
        }
        
        // Check if RSVP already exists for this PIN
        const existingIndex = currentRsvps.findIndex(r => r.pin === rsvpData.pin);
        if (existingIndex !== -1) {
            // Update existing RSVP
            currentRsvps[existingIndex] = rsvpData;
        } else {
            // Add new RSVP
            currentRsvps.push(rsvpData);
        }

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
                    message: existingIndex !== -1 ? 'Updated RSVP' : 'New RSVP submission',
                    content: Buffer.from(JSON.stringify(currentRsvps, null, 2)).toString('base64'),
                    sha: sha,
                    branch: 'data'
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return res.status(updateResponse.status).json({ 
                error: error.message || 'Failed to save RSVP' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: existingIndex !== -1 ? 'RSVP updated' : 'RSVP saved' 
        });

    } catch (error) {
        console.error('Error saving RSVP:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

