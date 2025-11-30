```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
};

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get user
        const userData = await kv.get(`user:${ email } `);
        if (!userData) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

        // Verify password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken(user.id, user.email);

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
```
