import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { subdomain } = req.query;

    if (!subdomain || typeof subdomain !== 'string') {
        return res.status(400).json({ error: 'Subdomain is required' });
    }

    try {
        // Get deployment ID from subdomain
        const deploymentId = await kv.get(`subdomain:${subdomain}`);

        if (!deploymentId || typeof deploymentId !== 'string') {
            return res.status(404).json({ error: 'Site not found' });
        }

        // Get deployment data
        const deploymentData = await kv.get(`deployment:${deploymentId}`);

        if (!deploymentData) {
            return res.status(404).json({ error: 'Site not found' });
        }

        const deployment = typeof deploymentData === 'string'
            ? JSON.parse(deploymentData)
            : deploymentData;

        // Increment visitor count
        deployment.visitors = (deployment.visitors || 0) + 1;
        await kv.set(`deployment:${deploymentId}`, JSON.stringify(deployment));

        res.json(deployment);
    } catch (error) {
        console.error('Error fetching site:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
