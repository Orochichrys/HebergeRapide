import type { VercelRequest } from '@vercel/node';

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
 * Log an activity - TEMPORARILY DISABLED to prevent crashes
 * TODO: Re-enable once Upstash KV is properly configured
 */
export async function logActivity(
    type: ActivityLog['type'],
    metadata: any,
    req?: VercelRequest,
    user?: { id: string; email: string; name: string }
): Promise<void> {
    try {
        // Just log to console for now
        console.log(`[ACTIVITY] ${type} by ${user?.email || 'anonymous'}`, metadata);
    } catch (error) {
        console.error('[ACTIVITY] Failed to log activity:', error);
    }
}

/**
 * Get recent activities - TEMPORARILY RETURNS EMPTY
 */
export async function getRecentActivities(limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
    return [];
}

/**
 * Get activity statistics - TEMPORARILY RETURNS ZEROS
 */
export async function getActivityStats(): Promise<{
    totalActivities: number;
    last24h: number;
    last7d: number;
    byType: Record<string, number>;
}> {
    return {
        totalActivities: 0,
        last24h: 0,
        last7d: 0,
        byType: {},
    };
}
