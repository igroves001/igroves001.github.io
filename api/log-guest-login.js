// Vercel serverless function to log guest login to GitHub

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
        const { pin } = req.body;

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
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json?ref=data`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!fileResponse.ok) {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read guests file' 
            });
        }

        const file = await fileResponse.json();
        const currentGuests = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));

        // Find the guest
        const guestIndex = currentGuests.findIndex(g => g.pin === pin);
        if (guestIndex === -1) {
            return res.status(404).json({ error: 'Guest not found' });
        }

        // Initialize logon array if it doesn't exist
        if (!currentGuests[guestIndex].logon) {
            currentGuests[guestIndex].logon = [];
        }

        // Add login entry
        const loginEntry = {
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-GB'),
            time: new Date().toLocaleTimeString('en-GB')
        };
        currentGuests[guestIndex].logon.push(loginEntry);

        // Write back to GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json?ref=data`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Logged guest login for PIN ${pin}`,
                    content: Buffer.from(JSON.stringify(currentGuests, null, 2)).toString('base64'),
                    sha: file.sha,
                    branch: 'data'
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return res.status(updateResponse.status).json({ 
                error: error.message || 'Failed to log guest login' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Login logged successfully' 
        });

    } catch (error) {
        console.error('Error logging guest login:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

