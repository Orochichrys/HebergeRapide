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
            // Get the deployment to verify ownership
            const deployment = await kv.get(`deployment:${id}`);

            if (!deployment) {
                return res.status(404).json({ error: 'Site not found' });
            }

            const deploymentData = typeof deployment === 'string' ? JSON.parse(deployment) : deployment;

            // Verify the user owns this deployment
            if (deploymentData.userId !== decoded.userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this site' });
            }

            // Delete the deployment from Redis
            await kv.del(`deployment:${id}`);

            // Remove from user's deployments list
            const userDeploymentsKey = `user:${decoded.userId}:deployments`;
            await kv.srem(userDeploymentsKey, id);

            return res.status(204).end();
        } catch (error) {
            console.error('Error deleting site:', error);
            return res.status(500).json({ error: 'Failed to delete site' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
