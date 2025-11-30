import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { hashPassword } from '../../utils/auth';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    console.log('Register handler called');
    console.log('Environment check:', {
        KV_URL: !!process.env.KV_REST_API_URL,
        KV_TOKEN: !!process.env.KV_REST_API_TOKEN
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('Checking if user exists:', email);
        // Check if user exists
        const existingUser = await kv.get(`user:${email}`);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        console.log('Hashing password...');
        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const userId = Math.random().toString(36).substring(2, 15);
        const user = {
            id: userId,
            name,
            email,
            password: hashedPassword,
            createdAt: Date.now()
        };

        console.log('Saving user to KV...');
        await kv.set(`user:${email}`, JSON.stringify(user));

        return res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
        console.error('Error in register handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        });
    }
}
