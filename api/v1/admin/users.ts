import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { verifyToken, requireAdmin } from '../../utils/adminMiddleware';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify authentication and admin role
        const user = verifyToken(req);
        requireAdmin(user);

        // Get all user IDs
        const userKeys = await kv.keys('user:*');
        const userIdKeys = userKeys.filter(key => !key.includes(':email:') && !key.includes(':google:'));

        // Fetch all users
        const users = [];
        for (const key of userIdKeys) {
            const userData = await kv.get(key);
            if (userData) {
                const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
                // Remove sensitive data
                const { password, ...userWithoutPassword } = user;
                users.push(userWithoutPassword);
            }
        }

        // Sort by creation date (newest first)
        users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return res.json({ users });
    } catch (error: any) {
        console.error('[ADMIN_USERS] Error:', error);

        if (error.message === 'Authentication required') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (error.message === 'Admin access required') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
}
