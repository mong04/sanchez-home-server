import React from 'react';
import {
    LayoutDashboard,
    Calendar,
    Heart,
    Infinity as InfinityIcon,
    CheckSquare,
    Menu,
    MessageSquare
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { ThemeToggle } from '../common/ThemeToggle';

interface AppLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
    { id: 'smart-planner', label: 'Planner', icon: Calendar },
    { id: 'family-messenger', label: 'Messenger', icon: MessageSquare },
    { id: 'wellness-engine', label: 'Wellness', icon: Heart },
    { id: 'infinity-log', label: 'Infinity Log', icon: InfinityIcon },
    { id: 'organizer', label: 'Organizer', icon: CheckSquare },
];

export function AppLayout({ children, activeTab, onTabChange }: AppLayoutProps) {
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
                    {NAV_ITEMS.map((item) => (
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border z-10">
                    <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                        SFOS
                    </h1>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </div>
                </header>
                {/* Mobile Theme Toggle (Floating or within Menu? For now, let's put it in the header for easy access or create a floating one? Header is safer) */}
                {/* Actually, user asked for "Visual icon change (Sun/Moon)". Let's add it next to the menu or instead of the placeholder menu if unused. 
                    The current header has a hamburger menu. I'll add the toggle next to it. */}
                <div className="md:hidden absolute top-4 right-16 z-20">
                    <ThemeToggle />
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth">
                    <div
                        key={activeTab}
                        className="max-w-7xl mx-auto pb-24 md:pb-0 animate-in fade-in duration-300 slide-in-from-bottom-4"
                    >
                        {children}
                    </div>
                </div>

                {/* Bottom Nav (Mobile) */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border pb-safe z-50">
                    <div className="flex justify-around items-center h-16">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className="flex flex-col items-center justify-center w-full h-full space-y-1"
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
        </div>
    );
}
