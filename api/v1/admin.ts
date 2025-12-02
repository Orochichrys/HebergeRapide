import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { verifyToken, requireAdmin } from '../utils/adminMiddleware';
import { getRecentActivities, getActivityStats } from '../utils/activityLogger';

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

        // Route based on 'type' query parameter
        const { type } = req.query;

        switch (type) {
            case 'activity':
                return await handleActivity(req, res);
            case 'stats':
                return await handleStats(req, res);
            case 'users':
                return await handleUsers(req, res);
            default:
                return res.status(400).json({ error: 'Invalid type parameter. Use: activity, stats, or users' });
        }
    } catch (error: any) {
        console.error('[ADMIN] Error:', error);

        if (error.message === 'Authentication required') {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (error.message === 'Admin access required') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle activity logs
async function handleActivity(req: VercelRequest, res: VercelResponse) {
    const { limit = '50', offset = '0' } = req.query;
    const activities = await getRecentActivities(
        parseInt(limit as string),
        parseInt(offset as string)
    );
    return res.json({ activities });
}

// Handle stats
async function handleStats(req: VercelRequest, res: VercelResponse) {
    // Get all user IDs
    const userKeys = await kv.keys('user:*');
    const userIdKeys = userKeys.filter(key => !key.includes(':email:') && !key.includes(':google:'));
    const totalUsers = userIdKeys.length;

    // Get all site IDs
    const siteKeys = await kv.keys('site:*');
    const totalSites = siteKeys.length;

    // Get activity stats
    const activityStats = await getActivityStats();

    return res.json({
        stats: {
            totalUsers,
            totalSites,
            ...activityStats,
        }
    });
}

// Handle users list
async function handleUsers(req: VercelRequest, res: VercelResponse) {
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
}
