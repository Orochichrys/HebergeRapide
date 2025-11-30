```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const results: any = {
    env: {
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasKvUrl: !!process.env.KV_REST_API_URL
    },
    checks: {}
  };

  try {
    // Test Bcrypt
    console.log('Testing bcrypt...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('test', salt);
    results.checks.bcrypt = 'OK';
  } catch (e: any) {
    console.error('Bcrypt failed:', e);
    results.checks.bcrypt = `FAILED: ${ e.message } `;
  }

  try {
    // Test KV
    console.log('Testing KV...');
    await kv.set('test_key', 'test_value');
    const val = await kv.get('test_key');
    results.checks.kv = val === 'test_value' ? 'OK' : 'FAILED (Value mismatch)';
  } catch (e: any) {
    console.error('KV failed:', e);
    results.checks.kv = `FAILED: ${ e.message } `;
  }

  res.status(200).json(results);
}
```
