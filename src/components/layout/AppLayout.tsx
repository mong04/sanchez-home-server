import { useState, Suspense, lazy } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { FeedbackModal } from '../common/FeedbackModal';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { NavigationSidebar } from './navigation/NavigationSidebar';
import { TopBar } from './navigation/TopBar';
import { MobileBottomNav } from './navigation/MobileBottomNav';
import { MobileDrawer } from './navigation/MobileDrawer';
import type { UserRole, QuickActionId } from './navigation/navConfig';

// CommandPalette is lazy-loaded — it's heavy and only needed on demand
const CommandPalette = lazy(() =>
    import('./navigation/CommandPalette').then(m => ({ default: m.CommandPalette }))
);

export function AppLayout() {
    const { user, logout } = useAuth();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();

    const userRole = user?.role as UserRole | undefined;

    // Quick action handler — navigate to the relevant module
    const handleQuickAction = (id: QuickActionId) => {
        switch (id) {
            case 'new-transaction':
                navigate('/finance');
                break;
            case 'new-event':
                navigate('/planner');
                break;
            case 'new-message':
                navigate('/messenger');
                break;
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            {/* ── Desktop/Tablet Collapsible Sidebar (hidden on mobile) ── */}
            <NavigationSidebar
                user={user}
                onFeedback={() => setIsFeedbackOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
                isOnline={isOnline}
            />

            {/* ── Main column (top bar + scrollable content + mobile bottom nav) ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Slim top bar on all breakpoints */}
                <TopBar
                    user={user}
                    onFeedback={() => setIsFeedbackOpen(true)}
                    onLogout={() => setIsLogoutModalOpen(true)}
                    isOnline={isOnline}
                    isSyncing={false}
                    notificationCount={0}
                />

                {/* Page content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto overflow-x-hidden relative bg-background"
                    tabIndex={-1}
                >
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-0"
                    >
                        <Suspense
                            fallback={
                                <div className="flex items-center justify-center h-64" aria-label="Loading page">
                                    <div className="flex space-x-2" aria-hidden="true">
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
                                    </div>
                                </div>
                            }
                        >
                            <Outlet />
                        </Suspense>
                    </motion.div>
                </main>

                {/* Mobile bottom tab bar (5 tabs + More) */}
                <MobileBottomNav userRole={userRole} />
            </div>

            {/* ── Mobile "More" bottom sheet drawer ── */}
            <MobileDrawer
                user={user}
                onFeedback={() => setIsFeedbackOpen(true)}
                onLogout={() => setIsLogoutModalOpen(true)}
            />

            {/* ── Global Command Palette (⌘K) — lazy-loaded ── */}
            <Suspense fallback={null}>
                <CommandPalette
                    userRole={userRole}
                    onQuickAction={handleQuickAction}
                />
            </Suspense>

            {/* ── Feedback Modal ── */}
            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
            />

            {/* ── Logout Confirmation Modal ── */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Log Out"
                description="Are you sure you want to log out? You will need to re-authenticate to access the system."
                footer={
                    <div className="flex w-full gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setIsLogoutModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                await logout();
                                setIsLogoutModalOpen(false);
                            }}
                        >
                            Log Out
                        </Button>
                    </div>
                }
            >
                <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-foreground">
                        Any unsaved changes in the text editor will be preserved, but your session will be ended immediately.
                    </p>
                </div>
            </Modal >
        </div >
    );
}
