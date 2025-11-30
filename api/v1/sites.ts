import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Seulement GET
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier l'autorisation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.replace('Bearer ', '');

    // Vérifier que la clé API existe
    if (!apiKey.startsWith('hr_live_')) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key format' });
    }

    try {
        // Récupérer tous les IDs de déploiements pour cette clé API
        const deploymentIds = await kv.smembers(`api:${apiKey}:deployments`);

        // Récupérer tous les déploiements
        const deployments = await Promise.all(
            (deploymentIds as string[]).map(async (id: string) => {
                const data = await kv.get(`deployment:${id}`);
                if (data) {
                    const deployment = JSON.parse(data as string);
                    // Exclure le code et l'API key de la réponse
                    const { code, apiKey: _, ...rest } = deployment;
                    return rest;
                }
                return null;
            })
        );

        // Filtrer les nulls et trier par date
        const userDeployments = deployments
            .filter(d => d !== null)
            .sort((a: any, b: any) => b.createdAt - a.createdAt);

        return res.status(200).json({
            sites: userDeployments,
            count: userDeployments.length
        });
    } catch (error) {
        console.error('Error fetching deployments:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
