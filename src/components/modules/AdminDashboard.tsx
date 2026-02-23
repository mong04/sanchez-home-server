import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAdminStats } from '../../hooks/use-admin-stats';
import { useInfinityLog } from '../../hooks/use-infinity-log';
import { MetricCard } from '../ui/dashboard/MetricCard';
import { ActivityFeed } from '../ui/dashboard/ActivityFeed';
import { AddUserDialog } from '../admin/AddUserDialog';
import { ShieldAlert, Users, CheckSquare, Receipt, Activity, Wifi } from 'lucide-react';
import { provider } from '../../lib/yjs-provider';

import { UserManagement } from '../admin/UserManagement';

export function AdminDashboard() {
    const { user, profiles } = useAuth();
    const navigate = useNavigate();
    const { onlineUsers, activeChoresCount, totalXP, systemStatus, userCount } = useAdminStats();
    const { items: logItems } = useInfinityLog();
    const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleForceSync = () => {
        setIsSyncing(true);
        // Force reconnection logic
        provider.disconnect();
        setTimeout(() => {
            provider.connect();
            setTimeout(() => setIsSyncing(false), 1000); // Visual feedback delay
        }, 500);
    };



    if (user?.role !== 'admin' && user?.role !== 'parent') {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center space-y-4 max-w-md">
                    <div className="bg-destructive/10 p-4 rounded-full inline-flex">
                        <ShieldAlert className="w-12 h-12 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold">Access Restricted</h2>
                    <p className="text-muted-foreground">
                        You do not have permission to view this area.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                    <p className="text-muted-foreground">Manage system access and settings.</p>
                </div>
            </div>

            {/* Segmented Control (iPadOS Style) */}
            <div
                className="relative flex p-1 bg-muted/80 backdrop-blur-md rounded-xl border border-border/50 shadow-inner"
                role="tablist"
                aria-label="Admin Sections"
            >
                {/* Sliding Background */}
                <div
                    className={`absolute top-1 bottom-1 rounded-lg bg-background shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${activeTab === 'overview' ? 'left-1 w-[calc(50%-4px)]' : 'left-[50%] w-[calc(50%-4px)]'
                        }`}
                    aria-hidden="true"
                />

                <button
                    role="tab"
                    aria-selected={activeTab === 'overview'}
                    aria-controls="overview-panel"
                    id="overview-tab"
                    onClick={() => setActiveTab('overview')}
                    className={`relative z-10 w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === 'overview'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    System Overview
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'users'}
                    aria-controls="users-panel"
                    id="users-tab"
                    onClick={() => setActiveTab('users')}
                    className={`relative z-10 w-1/2 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === 'users'
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    User Management
                </button>
            </div>

            {activeTab === 'overview' ? (
                /* System Overview Grid */
                <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Active Users"
                            value={`${onlineUsers} / ${userCount}`}
                            subtext="Currently online"
                            icon={Users}
                            variant="neutral"
                        />
                        <MetricCard
                            title="System Health"
                            value={systemStatus === 'connected' ? 'Normal' : 'Offline'}
                            subtext="PartyKit Connection"
                            icon={Wifi}
                            variant={systemStatus === 'connected' ? 'success' : 'destructive'}
                        />
                        <MetricCard
                            title="Pending Chores"
                            value={activeChoresCount}
                            subtext="Total configured"
                            icon={CheckSquare}
                            variant="warning"
                        />
                        <MetricCard
                            title="Family XP"
                            value={totalXP.toLocaleString()}
                            subtext="Total earned"
                            icon={Activity}
                            variant="info"
                        />
                    </div>

                    <div className="grid gap-6 md:grid-cols-7">
                        {/* Feed */}
                        <div className="md:col-span-4 lg:col-span-5 space-y-4">
                            <ActivityFeed
                                items={logItems.slice(0, 20).map(item => ({
                                    id: item.id,
                                    type: (item.tags?.find(t => ['chore', 'finance', 'system', 'user', 'wellness'].includes(t)) as any) || 'system',
                                    title: item.content,
                                    timestamp: item.createdAt,
                                    description: item.tags?.join(', ')
                                }))}
                                users={profiles}
                                className="bg-card rounded-xl border border-border shadow-sm p-4"
                            />
                        </div>

                        {/* Quick Actions */}
                        <div className="md:col-span-3 lg:col-span-2 space-y-4">
                            <div className="bg-card rounded-xl border border-border shadow-sm p-4 h-full">
                                <h3 className="font-semibold mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    <button
                                        onClick={() => setIsAddUserOpen(true)}
                                        className="p-3 md:p-4 text-xs md:text-sm font-medium bg-muted/40 hover:bg-muted rounded-xl border border-border/50 transition-colors flex flex-col items-center gap-2 md:gap-3 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden min-h-[72px] md:min-h-[88px] justify-center"
                                    >
                                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        Add User
                                    </button>
                                    <button
                                        onClick={handleForceSync}
                                        disabled={isSyncing}
                                        className="p-3 md:p-4 text-xs md:text-sm font-medium bg-muted/40 hover:bg-muted rounded-xl border border-border/50 transition-colors flex flex-col items-center gap-2 md:gap-3 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden min-h-[72px] md:min-h-[88px] justify-center disabled:opacity-50"
                                    >
                                        <div className={`p-2 rounded-full bg-destructive/10 text-destructive ${isSyncing ? 'animate-spin' : ''}`}>
                                            {isSyncing ? <Activity className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                        </div>
                                        {isSyncing ? 'Syncing...' : 'Force Sync'}
                                    </button>
                                    <button
                                        onClick={() => alert("Bill Scanning coming soon!")}
                                        className="p-3 md:p-4 text-xs md:text-sm font-medium bg-muted/40 hover:bg-muted rounded-xl border border-border/50 transition-colors flex flex-col items-center gap-2 md:gap-3 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden min-h-[72px] md:min-h-[88px] justify-center"
                                    >
                                        <div className="p-2 rounded-full bg-warning/10 text-warning">
                                            <Receipt className="w-5 h-5" />
                                        </div>
                                        Scan Bill
                                    </button>
                                    <button
                                        onClick={() => navigate('/chores')}
                                        className="p-3 md:p-4 text-xs md:text-sm font-medium bg-muted/40 hover:bg-muted rounded-xl border border-border/50 transition-colors flex flex-col items-center gap-2 md:gap-3 text-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden min-h-[72px] md:min-h-[88px] justify-center"
                                    >
                                        <div className="p-2 rounded-full bg-success/10 text-success">
                                            <CheckSquare className="w-5 h-5" />
                                        </div>
                                        Add Chore
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <UserManagement />
                </div>
            )}

            <AddUserDialog
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onUserAdded={() => {
                    // Optional: refresh logic if needed, but Yjs/PartyKit is real-time
                }}
            />

            {/* Technical Health Footer */}
            <footer className="pt-6 border-t border-border/40 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span>Version 1.0.0-beta</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Storage: Local (IndexedDB) + Cloud (PartyKit)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${systemStatus === 'connected' ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
                    {systemStatus === 'connected' ? 'System Operational' : 'Connection Lost'}
                </div>
            </footer>
        </div>
    );
}
