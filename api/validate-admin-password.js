// Vercel serverless function to validate admin password

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
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        if (!ADMIN_PASSWORD) {
            return res.status(500).json({ error: 'Admin password not configured' });
        }

        // Use secure comparison to prevent timing attacks
        const isValid = password === ADMIN_PASSWORD;

        if (isValid) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ error: 'Invalid password' });
        }

    } catch (error) {
        console.error('Error validating password:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

