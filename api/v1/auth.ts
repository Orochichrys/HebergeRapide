import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/v1/auth?action=google-callback`
    : 'http://localhost:5173/api/v1/auth?action=google-callback';
const FRONTEND_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:5173';

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const { action } = req.query;

    // Handle different auth actions
    switch (action) {
        case 'login':
            return handleLogin(req, res);
        case 'register':
            return handleRegister(req, res);
        case 'google':
            return handleGoogleOAuth(req, res);
        case 'google-callback':
            return handleGoogleCallback(req, res);
        default:
            return res.status(400).json({ error: 'Invalid action' });
    }
}

// Login handler
async function handleLogin(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const userId = await kv.get(`user:email:${email}`);
        if (!userId || typeof userId !== 'string') {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userData = await kv.get(`user:${userId}`);
        if (!userData) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = typeof userData === 'string' ? JSON.parse(userData) : userData;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Register handler
async function handleRegister(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingUser = await kv.get(`user:email:${email}`);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = nanoid();

        const user = {
            id: userId,
            name,
            email,
            password: hashedPassword,
            createdAt: Date.now(),
        };

        await kv.set(`user:${userId}`, JSON.stringify(user));
        await kv.set(`user:email:${email}`, userId);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Google OAuth initiation
async function handleGoogleOAuth(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    googleAuthUrl.searchParams.append('response_type', 'code');
    googleAuthUrl.searchParams.append('scope', 'email profile');
    googleAuthUrl.searchParams.append('access_type', 'offline');
    googleAuthUrl.searchParams.append('prompt', 'consent');

    res.redirect(googleAuthUrl.toString());
}

// Google OAuth callback
async function handleGoogleCallback(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, error } = req.query;

    if (error) {
        return res.redirect(`${FRONTEND_URL}/?error=google_auth_failed`);
    }

    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json();

        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();

        let user = await kv.get(`user:email:${googleUser.email}`);
        let userId: string;

        if (!user) {
            userId = nanoid();
            user = {
                id: userId,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                googleId: googleUser.id,
                createdAt: Date.now(),
            };

            await kv.set(`user:${userId}`, JSON.stringify(user));
            await kv.set(`user:email:${googleUser.email}`, userId);
            await kv.set(`user:google:${googleUser.id}`, userId);
        } else {
            userId = typeof user === 'string' ? user : (user as any).id;
            const userData = await kv.get(`user:${userId}`);
            user = typeof userData === 'string' ? JSON.parse(userData) : userData;
        }

        const token = jwt.sign(
            { userId, email: googleUser.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.redirect(`${FRONTEND_URL}/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${FRONTEND_URL}/?error=google_auth_failed`);
    }
}
