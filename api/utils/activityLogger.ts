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
 * Simplified version using only basic KV operations
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

        // Store individual log with TTL
        await kv.set(`activity:${id}`, JSON.stringify(log), { ex: 60 * 60 * 24 * 30 }); // 30 days TTL

        // Store in a simple list (with timestamp prefix for sorting)
        const indexKey = 'activity:list';
        const existingList = await kv.get<string[]>(indexKey) || [];

        // Add new entry at the beginning (newest first)
        const newList = [id, ...existingList.slice(0, 499)]; // Keep only 500 most recent
        await kv.set(indexKey, newList);

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
        // Get IDs from list
        const indexKey = 'activity:list';
        const ids = await kv.get<string[]>(indexKey) || [];

        // Paginate
        const paginatedIds = ids.slice(offset, offset + limit);

        if (paginatedIds.length === 0) {
            return [];
        }

        // Fetch all logs
        const logs: ActivityLog[] = [];
        for (const id of paginatedIds) {
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

        // Get all activities
        const allLogs = await getRecentActivities(500, 0);

        // Calculate stats
        const total = allLogs.length;
        const last24h = allLogs.filter(log => log.timestamp >= oneDayAgo).length;
        const last7d = allLogs.filter(log => log.timestamp >= sevenDaysAgo).length;

        // Count by type
        const byType: Record<string, number> = {};
        allLogs.slice(0, 100).forEach(log => {
            byType[log.type] = (byType[log.type] || 0) + 1;
        });

        return {
            totalActivities: total,
            last24h,
            last7d,
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
