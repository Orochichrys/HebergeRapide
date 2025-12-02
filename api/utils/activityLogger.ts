import type { VercelRequest } from '@vercel/node';
import { kv } from '@vercel/kv';

interface ActivityLog {
    id: string;
    type: 'login' | 'register' | 'google_auth' | 'deploy' | 'delete_site' | 'visit' | 'update_site';
    userId?: string;
    userEmail?: string;
    userName?: string;
    metadata: any;
    timestamp: number;
    ip?: string;
}

/**
 * Log an activity to Upstash KV
 */
export async function logActivity(
    type: ActivityLog['type'],
    metadata: any,
    req?: VercelRequest,
    user?: { id: string; email: string; name: string }
): Promise<void> {
    try {
        const timestamp = Date.now();
        const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

        const log: ActivityLog = {
            id,
            type,
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            metadata,
            timestamp,
            ip: req?.headers['x-forwarded-for'] as string || req?.headers['x-real-ip'] as string,
        };

        // Store individual log
        await kv.set(`activity:${id}`, JSON.stringify(log), { ex: 60 * 60 * 24 * 30 }); // 30 days TTL

        // Add to sorted set for easy retrieval (score = timestamp)
        await kv.zadd('activity:index', { score: timestamp, member: id });

        console.log(`[ACTIVITY] Logged: ${type} by ${user?.email || 'anonymous'}`);
    } catch (error) {
        console.error('[ACTIVITY] Failed to log activity:', error);
        // Don't throw - logging should not break the main flow
    }
}

/**
 * Get recent activities (paginated)
 */
export async function getRecentActivities(limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
    try {
        // Get IDs from sorted set (newest first)
        const ids = await kv.zrange('activity:index', offset, offset + limit - 1, { rev: true });

        if (!ids || ids.length === 0) {
            return [];
        }

        // Fetch all logs
        const logs: ActivityLog[] = [];
        for (const id of ids) {
            const logData = await kv.get(`activity:${id}`);
            if (logData) {
                const log = typeof logData === 'string' ? JSON.parse(logData) : logData;
                logs.push(log);
            }
        }

        return logs;
    } catch (error) {
        console.error('[ACTIVITY] Failed to get activities:', error);
        return [];
    }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(): Promise<{
    totalActivities: number;
    last24h: number;
    last7d: number;
    byType: Record<string, number>;
}> {
    try {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

        // Get total count
        const total = await kv.zcard('activity:index') || 0;

        // Get counts by time range
        const last24hCount = await kv.zcount('activity:index', oneDayAgo, now) || 0;
        const last7dCount = await kv.zcount('activity:index', sevenDaysAgo, now) || 0;

        // Get recent activities to count by type
        const recentLogs = await getRecentActivities(100);
        const byType: Record<string, number> = {};
        recentLogs.forEach(log => {
            byType[log.type] = (byType[log.type] || 0) + 1;
        });

        return {
            totalActivities: total,
            last24h: last24hCount,
            last7d: last7dCount,
            byType,
        };
    } catch (error) {
        console.error('[ACTIVITY] Failed to get stats:', error);
        return {
            totalActivities: 0,
            last24h: 0,
            last7d: 0,
            byType: {},
        };
    }
}
