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
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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

    // GET - Retrieve deployment details
    if (req.method === 'GET') {
        try {
            const deployment = await kv.get(`deployment:${id}`);

            if (!deployment) {
                return res.status(404).json({ error: 'Site not found' });
            }

            const deploymentData = typeof deployment === 'string' ? JSON.parse(deployment) : deployment;

            // Verify ownership
            if (deploymentData.userId !== decoded.userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this site' });
            }

            return res.status(200).json(deploymentData);
        } catch (error) {
            console.error('Error fetching site:', error);
            return res.status(500).json({ error: 'Failed to fetch site' });
        }
    }

    // PUT - Update deployment code
    if (req.method === 'PUT') {
        try {
            const deployment = await kv.get(`deployment:${id}`);

            if (!deployment) {
                return res.status(404).json({ error: 'Site not found' });
            }

            const deploymentData = typeof deployment === 'string' ? JSON.parse(deployment) : deployment;

            // Verify ownership
            if (deploymentData.userId !== decoded.userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this site' });
            }

            const { code, css, js } = req.body;

            // Update the deployment object
            const updatedDeployment = {
                ...deploymentData,
                code: code !== undefined ? code : deploymentData.code,
                css: css !== undefined ? css : deploymentData.css,
                js: js !== undefined ? js : deploymentData.js,
                lastModified: Date.now()
            };

            await kv.set(`deployment:${id}`, JSON.stringify(updatedDeployment));

            return res.status(200).json(updatedDeployment);
        } catch (error) {
            console.error('Error updating site:', error);
            return res.status(500).json({ error: 'Failed to update site' });
        }
    }

    // DELETE - Delete deployment
    if (req.method === 'DELETE') {
        try {
            const deployment = await kv.get(`deployment:${id}`);

            if (!deployment) {
                return res.status(404).json({ error: 'Site not found' });
            }

            const deploymentData = typeof deployment === 'string' ? JSON.parse(deployment) : deployment;

            if (deploymentData.userId !== decoded.userId) {
                return res.status(403).json({ error: 'Forbidden: You do not own this site' });
            }

            await kv.del(`deployment:${id}`);

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
