import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

const verifyToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Vérifier l'autorisation
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    const { name, password } = req.body;

    try {
        // Récupérer l'utilisateur actuel
        // Note: decoded.email est dans le token
        const userKey = `user:${decoded.email}`;
        const userData = await kv.get(userKey);

        if (!userData) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

        // Mettre à jour les champs
        if (name) {
            user.name = name;
        }

        if (password) {
            user.password = await hashPassword(password);
        }

        // Sauvegarder
        await kv.set(userKey, JSON.stringify(user));

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
