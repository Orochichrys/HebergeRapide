import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { hashPassword, generateToken } from './utils/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const results: any = {
        env: {
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasKvUrl: !!process.env.KV_REST_API_URL
        },
        checks: {}
    };

    try {
        // Test Auth Utils Import & Bcrypt
        console.log('Testing hashPassword from utils...');
        await hashPassword('test');
        results.checks.authUtils_bcrypt = 'OK';
    } catch (e: any) {
        console.error('Auth Utils Bcrypt failed:', e);
        results.checks.authUtils_bcrypt = `FAILED: ${e.message}`;
    }

    try {
        // Test JWT
        console.log('Testing JWT...');
        const token = generateToken('test_user', 'test@example.com');
        if (token && typeof token === 'string' && token.length > 10) {
            results.checks.jwt = 'OK';
        } else {
            results.checks.jwt = 'FAILED: Token generation returned invalid result';
        }
    } catch (e: any) {
        console.error('JWT failed:', e);
        results.checks.jwt = `FAILED: ${e.message}`;
    }

    try {
        // Test KV
        console.log('Testing KV...');
        await kv.set('test_key', 'test_value');
        const val = await kv.get('test_key');
        results.checks.kv = val === 'test_value' ? 'OK' : 'FAILED (Value mismatch)';
    } catch (e: any) {
        console.error('KV failed:', e);
        results.checks.kv = `FAILED: ${e.message}`;
    }

    res.status(200).json(results);
}
