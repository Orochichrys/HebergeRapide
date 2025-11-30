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

  const { subdomain } = req.query;

  if (!subdomain || typeof subdomain !== 'string') {
    return res.status(400).json({ error: 'Missing subdomain parameter' });
  }

  try {
    // Récupérer l'ID depuis le subdomain
    const id = await kv.get(`subdomain:${subdomain}`);
    
    if (!id) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Récupérer le déploiement
    const data = await kv.get(`deployment:${id}`);
    
    if (!data) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const deployment = JSON.parse(data as string);
    
    // Retourner seulement les données nécessaires (sans l'API key)
    const { apiKey: _, ...publicDeployment } = deployment;

    return res.status(200).json(publicDeployment);
  } catch (error: any) {
    console.error('Error fetching site:', error);
    // Si KV n'est pas configuré, retourner une erreur explicite
    if (error.message?.includes('KV') || error.message?.includes('Redis')) {
      return res.status(500).json({ 
        error: 'Database not configured. Please set up Vercel KV in your project settings.' 
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}

