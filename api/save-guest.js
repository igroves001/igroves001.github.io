// Vercel serverless function to save/update guest to GitHub

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
        const { guestData, isUpdate } = req.body;

        if (!guestData || !guestData.pin || !guestData.name || !guestData.role) {
            return res.status(400).json({ error: 'Invalid guest data: pin, name, and role are required' });
        }

        // Validate guest_names array
        if (!guestData.guest_names || !Array.isArray(guestData.guest_names) || guestData.guest_names.length === 0) {
            return res.status(400).json({ error: 'At least one guest name is required' });
        }

        // Remove max_guests if present (migration cleanup)
        if (guestData.max_guests !== undefined) {
            delete guestData.max_guests;
        }

        // Validate role is one of the allowed values
        const validRoles = ['day_guest_staying', 'day_guest_not_staying', 'evening_guest'];
        if (!validRoles.includes(guestData.role)) {
            return res.status(400).json({ error: 'Invalid role. Must be one of: day_guest_staying, day_guest_not_staying, evening_guest' });
        }

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_REPO = process.env.GITHUB_REPO || 'igroves001/igroves001.github.io';

        if (!GITHUB_TOKEN) {
            return res.status(500).json({ error: 'GitHub token not configured' });
        }

        // Get authorization header
        const authHeader = GITHUB_TOKEN.startsWith('github_pat_') 
            ? `Bearer ${GITHUB_TOKEN}` 
            : `token ${GITHUB_TOKEN}`;

        // Get current file
        const fileResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let currentGuests = [];
        let sha = null;

        if (fileResponse.ok) {
            const file = await fileResponse.json();
            currentGuests = JSON.parse(Buffer.from(file.content, 'base64').toString('utf-8'));
            sha = file.sha;
        } else if (fileResponse.status === 404) {
            // File doesn't exist yet - create it
            sha = null;
        } else {
            const error = await fileResponse.json();
            return res.status(fileResponse.status).json({ 
                error: error.message || 'Failed to read guests file' 
            });
        }

        // Check for duplicate PIN (unless updating)
        if (!isUpdate) {
            const existingIndex = currentGuests.findIndex(g => g.pin === guestData.pin);
            if (existingIndex !== -1) {
                return res.status(400).json({ error: 'A guest with this PIN already exists' });
            }
            currentGuests.push(guestData);
        } else {
            // Update existing guest
            const existingIndex = currentGuests.findIndex(g => g.pin === guestData.pin);
            if (existingIndex === -1) {
                return res.status(404).json({ error: 'Guest not found' });
            }
            currentGuests[existingIndex] = guestData;
        }

        // Write back to GitHub
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/data/guests.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: isUpdate ? 'Updated guest' : 'Added new guest',
                    content: Buffer.from(JSON.stringify(currentGuests, null, 2)).toString('base64'),
                    sha: sha
                })
            }
        );

        if (!updateResponse.ok) {
            const error = await updateResponse.json();
            return res.status(updateResponse.status).json({ 
                error: error.message || 'Failed to save guest' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: isUpdate ? 'Guest updated' : 'Guest added' 
        });

    } catch (error) {
        console.error('Error saving guest:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

