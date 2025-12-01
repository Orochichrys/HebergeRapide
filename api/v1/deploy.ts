import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js';
}

interface DeployRequest {
  name: string;
  files: ProjectFile[];
}

interface JWTPayload {
  userId: string;
  email: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  const { name, files }: DeployRequest = req.body;

  if (!name || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Missing name or files' });
  }

  const id = nanoid(10);
  const subdomain = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-') + '-' + nanoid(4).toLowerCase();

  // Find main HTML for backward compatibility
  const mainHtml = files.find(f => f.type === 'html')?.content || '';
  const mainCss = files.find(f => f.type === 'css')?.content || '';
  const mainJs = files.find(f => f.type === 'js')?.content || '';

  const deployment = {
    id,
    subdomain,
    name,
    code: mainHtml, // Backward compatibility
    css: mainCss,   // Backward compatibility
    js: mainJs,     // Backward compatibility
    files,          // New field
    createdAt: Date.now(),
    status: 'live',
    url: `https://heberge-rapide.vercel.app/#/s/${subdomain}`,
    userId: decoded.userId,
    visitors: 0
  };

  try {
    // Save deployment
    await kv.set(`deployment:${id}`, JSON.stringify(deployment));

    // Add to user's deployments list
    const userDeploymentsKey = `user:${decoded.userId}:deployments`;
    await kv.sadd(userDeploymentsKey, id);

    // Map subdomain to deployment ID for fast lookup
    await kv.set(`subdomain:${subdomain}`, id);

    return res.status(200).json(deployment);
  } catch (error) {
    console.error('Error saving to Redis:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
