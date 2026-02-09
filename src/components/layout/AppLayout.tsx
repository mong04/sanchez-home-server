import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import { Calendar, CheckSquare, Heart, InfinityIcon, LayoutDashboard, LogOut, Menu, MessageSquare, Shield, User, X } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { FeedbackFab } from '../common/FeedbackFab';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface AppLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const BASE_NAV_ITEMS = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'smart-planner', label: 'Planner', icon: Calendar },
    { id: 'family-messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'wellness-engine', label: 'Wellness', icon: Heart },
    { id: 'infinity-log', label: 'Infinity Log', icon: InfinityIcon },
    { id: 'organizer', label: 'Organizer', icon: CheckSquare },
];

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const navItems = [...BASE_NAV_ITEMS];

    // Allow Admins AND Parents to see the Admin Dashboard
    if (user?.role === 'admin' || user?.role === 'parent') {
        navItems.push({ id: 'admin', label: 'Admin', icon: Shield });
    }

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                            Sanchez OS
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">v0.1.0 Alpha</p>
                    </div>
                    <ThemeToggle />
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={twMerge(
                                "flex items-center w-full p-3 rounded-xl transition-all duration-200 group text-left",
                                activeTab === item.id
                                    ? "bg-accent text-accent-foreground shadow-sm transform scale-[1.02] font-medium"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className={twMerge(
                                "w-5 h-5 mr-3 transition-colors",
                                activeTab === item.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* User Profile & Logout */}
                <div className="p-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Guest'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="flex items-center w-full p-3 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 group"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-medium">Log Out</span>
                    </button>
                </div>
            </aside>


            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border z-10 sticky top-0">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                        SFOS
                    </h1>
                    <div className="flex items-center gap-2">
                        <div className="mr-2">
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </header>

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed inset-y-0 right-0 w-[80%] max-w-sm bg-card border-l border-border z-50 md:hidden flex flex-col shadow-2xl"
                            >
                                <div className="p-4 border-b border-border flex items-center justify-between">
                                    <span className="font-bold text-lg">Menu</span>
                                    <button
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="p-2 rounded-full hover:bg-accent transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {navItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onTabChange(item.id);
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className={twMerge(
                                                "flex items-center w-full p-4 rounded-xl transition-all duration-200 text-left border border-transparent",
                                                activeTab === item.id
                                                    ? "bg-accent text-accent-foreground border-border/50 shadow-sm font-medium"
                                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className={twMerge(
                                                "w-5 h-5 mr-3",
                                                activeTab === item.id ? "text-primary" : "text-muted-foreground"
                                            )} />
                                            <span className="text-base">{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="p-4 border-t border-border mt-auto bg-muted/30">
                                    <div className="flex items-center gap-3 mb-4 p-3 bg-background rounded-xl border border-border/50">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Guest'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            setIsLogoutModalOpen(true);
                                        }}
                                        className="flex items-center justify-center w-full p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600 transition-all font-medium border border-red-500/20"
                                    >
                                        <LogOut className="w-5 h-5 mr-2" />
                                        Log Out
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>


                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-7xl mx-auto pb-24 md:pb-0"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Feedback FAB */}
                <FeedbackFab />

                {/* Bottom Nav (Mobile) */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border pb-safe z-40">
                    <div className="flex justify-around items-center h-16">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className="flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation"
                            >
                                <item.icon className={twMerge(
                                    "w-6 h-6 transition-colors",
                                    activeTab === item.id ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span className={twMerge(
                                    "text-[10px] font-medium",
                                    activeTab === item.id ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </nav>
            </main>

            {/* Logout Confirmation Modal */}
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
                            onClick={() => {
                                logout();
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
            </Modal>
        </div>
    );
}
