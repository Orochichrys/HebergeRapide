import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
    userId: string;
    email: string;
    role?: 'admin' | 'user';
}

/**
 * Verify JWT token and extract user info
 */
export function verifyToken(req: VercelRequest): AuthUser | null {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error);
        return null;
    }
}

/**
 * Require admin role
 */
export function requireAdmin(user: AuthUser | null): void {
    if (!user) {
        throw new Error('Authentication required');
    }

    if (user.role !== 'admin') {
        throw new Error('Admin access required');
    }
}
