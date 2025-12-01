import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REDIRECT_URI = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/v1/auth/google/callback`
    : 'http://localhost:5173/api/v1/auth/google/callback';
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
        // Exchange code for tokens
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

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!userInfoResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const googleUser: GoogleUserInfo = await userInfoResponse.json();

        // Check if user exists in our database
        let user = await kv.get(`user:email:${googleUser.email}`);
        let userId: string;

        if (!user) {
            // Create new user
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
            // User exists, get their ID
            userId = typeof user === 'string' ? user : (user as any).id;
            const userData = await kv.get(`user:${userId}`);
            user = typeof userData === 'string' ? JSON.parse(userData) : userData;
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId, email: googleUser.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.redirect(`${FRONTEND_URL}/?error=google_auth_failed`);
    }
}
