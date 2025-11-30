import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
    userId: string;
    email: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Extract site ID from query
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Site ID is required' });
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
        decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'DELETE') {
        try {
            // Get the site to verify ownership
            const site = await kv.hgetall(`site:${id}`);

            if (!site) {
                return res.status(404).json({ error: 'Site not found' });
            }

            // Verify the user owns this site
            if (site.userId !== decoded.userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this site' });
            }

            // Delete the site from Redis
            await kv.del(`site:${id}`);

            // Remove from user's sites list
            const userSitesKey = `user:${decoded.userId}:sites`;
            await kv.srem(userSitesKey, id);

            return res.status(204).end();
        } catch (error) {
            console.error('Error deleting site:', error);
            return res.status(500).json({ error: 'Failed to delete site' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
