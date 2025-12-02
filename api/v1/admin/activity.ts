import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { verifyToken, requireAdmin } from '../../utils/adminMiddleware';
import { getRecentActivities, getActivityStats } from '../../utils/activityLogger';

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

        const { limit = '50', offset = '0' } = req.query;
        const activities = await getRecentActivities(
            parseInt(limit as string),
            parseInt(offset as string)
        );

        return res.json({ activities });
    } catch (error: any) {
        console.error('[ADMIN_ACTIVITY] Error:', error);

        if (error.message === 'Authentication required') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (error.message === 'Admin access required') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
}
