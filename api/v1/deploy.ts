import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { verifyToken } from '../../utils/auth';

interface DeployRequest {
  name: string;
  html: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Seulement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vérifier l'autorisation
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const userId = decoded.userId;

  // Valider le body
  const { name, html }: DeployRequest = req.body;

  if (!name || !html) {
    return res.status(400).json({ error: 'Missing required fields: name and html are required' });
  }

  // Générer un ID et un subdomain
  const id = Math.random().toString(36).substr(2, 9);
  const subdomain = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') || id;

  // Créer le déploiement
  const origin = req.headers.origin || req.headers.host
    ? `https://${req.headers.host || 'heberge-rapide.vercel.app'}`
    : 'https://heberge-rapide.vercel.app';

  const deployment = {
    id,
    subdomain,
    name,
    code: html,
    createdAt: Date.now(),
    status: 'live',
    url: `${origin}/#/s/${subdomain}`,
    visitors: 0,
    userId // Associer à l'utilisateur
  };

  try {
    // Stocker le déploiement dans KV
    await kv.set(`deployment:${id}`, JSON.stringify(deployment));

    // Ajouter l'ID à la liste des déploiements de cet utilisateur
    await kv.sadd(`user:${userId}:deployments`, id);

    // Stocker aussi par subdomain pour la recherche rapide
    await kv.set(`subdomain:${subdomain}`, id);

    // Retourner la réponse avec URL courte (sans données encodées)
    return res.status(200).json({
      id: deployment.id,
      status: deployment.status,
      url: deployment.url, // URL courte maintenant
      subdomain: deployment.subdomain
    });
  } catch (error: any) {
    console.error('Error storing deployment:', error);
    // Si KV n'est pas configuré, retourner une erreur explicite
    if (error.message?.includes('KV') || error.message?.includes('Redis')) {
      return res.status(500).json({
        error: 'Database not configured. Please set up Vercel KV in your project settings.'
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
