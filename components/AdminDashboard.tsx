import React, { useState, useEffect } from 'react';
import { Activity, Users, Globe, TrendingUp, Clock, User as UserIcon } from 'lucide-react';

interface AdminDashboardProps {
    token: string | null;
}

interface ActivityLog {
    id: string;
    type: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    metadata: any;
    timestamp: number;
    ip?: string;
}

interface Stats {
    totalUsers: number;
    totalSites: number;
    totalActivities: number;
    last24h: number;
    last7d: number;
    byType: Record<string, number>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ token }) => {
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [token]);

    const fetchData = async () => {
        if (!token) return;

        try {
            const [activitiesRes, statsRes] = await Promise.all([
                fetch('/api/v1/admin?type=activity&limit=50', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/v1/admin?type=stats', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (activitiesRes.ok) {
                const data = await activitiesRes.json();
                setActivities(data.activities);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'login':
            case 'google_auth':
                return <UserIcon className="w-4 h-4" />;
            case 'register':
                return <Users className="w-4 h-4" />;
            case 'deploy':
            case 'update_site':
                return <Globe className="w-4 h-4" />;
            case 'visit':
                return <Activity className="w-4 h-4" />;
            default:
                return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'login':
            case 'google_auth':
                return 'text-blue-400';
            case 'register':
                return 'text-green-400';
            case 'deploy':
            case 'update_site':
                return 'text-purple-400';
            case 'delete_site':
                return 'text-red-400';
            case 'visit':
                return 'text-yellow-400';
            default:
                return 'text-gray-400';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes}min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        return date.toLocaleDateString('fr-FR');
    };

    const getActivityLabel = (log: ActivityLog) => {
        const name = log.userName || log.userEmail || 'Utilisateur';
        switch (log.type) {
            case 'login':
                return `${name} s'est connecté`;
            case 'google_auth':
                return `${name} s'est connecté via Google`;
            case 'register':
                return `${name} s'est inscrit`;
            case 'deploy':
                return `${name} a déployé un site`;
            case 'update_site':
                return `${name} a modifié un site`;
            case 'delete_site':
                return `${name} a supprimé un site`;
            case 'visit':
                return `Visite d'un site`;
            default:
                return `${name} - ${log.type}`;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-200">
                    Tableau de bord Admin
                </h1>
                <p className="text-muted-foreground mt-2">Surveillez l'activité de votre plateforme</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalUsers}</p>
                            </div>
                            <div className="bg-blue-500/10 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Sites déployés</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{stats.totalSites}</p>
                            </div>
                            <div className="bg-purple-500/10 p-3 rounded-lg">
                                <Globe className="w-6 h-6 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Activité 24h</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{stats.last24h}</p>
                            </div>
                            <div className="bg-green-500/10 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Activité 7j</p>
                                <p className="text-3xl font-bold text-foreground mt-1">{stats.last7d}</p>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-lg">
                                <Activity className="w-6 h-6 text-yellow-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Feed */}
            <div className="bg-card border border-border rounded-lg">
                <div className="px-6 py-4 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5 text-brand-400" />
                        Activité récente
                    </h2>
                </div>
                <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {activities.length === 0 ? (
                        <div className="px-6 py-12 text-center text-muted-foreground">
                            Aucune activité récente
                        </div>
                    ) : (
                        activities.map((log) => (
                            <div key={log.id} className="px-6 py-4 hover:bg-background/50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 ${getActivityColor(log.type)}`}>
                                        {getActivityIcon(log.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">
                                            {getActivityLabel(log)}
                                        </p>
                                        {log.userEmail && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {log.userEmail}
                                            </p>
                                        )}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {JSON.stringify(log.metadata)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatTimestamp(log.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
