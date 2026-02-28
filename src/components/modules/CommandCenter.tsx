import { useNavigate } from 'react-router-dom';
import { useCalendar } from '../../hooks/use-calendar';
import { useWellness } from '../../hooks/use-wellness';
import { useMessenger } from '../../hooks/use-messenger';
import { useChores, useBills } from '../../hooks/use-organizer';
import { useAuth } from '../../context/AuthContext';
import { CloudSun, Calendar as CalendarIcon, Smile, Frown, Meh, MessageSquare, CheckCircle, AlertTriangle, DollarSign, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Leaderboard } from '../modules/Leaderboard';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { PushPermissionDialog } from '../common/PushPermissionDialog';
import { isPushSupported, getSubscription } from '../../lib/push';

function getGreeting(): { text: string; emoji: string } {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
}

export function CommandCenter() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { events } = useCalendar();
    const { logEntry } = useWellness();
    const { messages } = useMessenger();
    const { getMyActiveChores, rotateChore } = useChores();
    const { getUpcomingBills } = useBills();
    const [showPushPrompt, setShowPushPrompt] = useState(false);

    useEffect(() => {
        const checkPush = async () => {
            if (isPushSupported()) {
                const sub = await getSubscription();
                const hasDismissed = localStorage.getItem('sfos-push-prompt-dismissed');
                if (!sub && !hasDismissed) {
                    // Premium touch: Wait 3 seconds after load to not overwhelm the user
                    const timer = setTimeout(() => setShowPushPrompt(true), 3000);
                    return () => clearTimeout(timer);
                }
            }
        };
        checkPush();
    }, []);

    const userId = user?.id || '';
    const activeChores = getMyActiveChores(userId);
    const upcomingBills = getUpcomingBills(14);
    const greeting = getGreeting();

    // Calculate unread
    const lastRead = parseInt(localStorage.getItem('sfos-messenger-last-read') || '0', 10);
    const unreadCount = messages.filter(m => m.timestamp > lastRead).length;

    // Up Next events
    const upcomingEvents = events
        .filter(e => e.start > Date.now())
        .sort((a, b) => a.start - b.start)
        .slice(0, 3);

    const handleMood = (mood: string) => {
        logEntry({
            type: 'mood',
            value: mood,
            tags: ['quick-check-in']
        });
    };

    const firstName = user?.name?.split(' ')[0] || 'Family';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border p-5 md:p-8">
                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">
                            {format(new Date(), 'EEEE, MMMM do')}
                        </p>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                            <span>{greeting.emoji}</span>
                            {greeting.text}, {firstName}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">Here's your daily briefing.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>{activeChores.length} tasks • {unreadCount} messages</span>
                    </div>
                </div>
                {/* Decorative gradient blob */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            </header>

            {/* Primary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                {/* Today's Mission (Chores) */}
                <Card
                    className="group border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    onClick={() => navigate('/organizer')}
                >
                    <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span>Today's Mission</span>
                        </CardTitle>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </CardHeader>
                    <CardContent>
                        {activeChores.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2.5 rounded-full bg-emerald-500/10 mb-2">
                                    <Smile className="w-5 h-5 text-emerald-500" />
                                </div>
                                <span className="font-medium">All clear!</span>
                                <span className="text-xs mt-0.5">No active chores 🎉</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {activeChores.map(chore => (
                                    <div key={chore.id} className="flex items-center justify-between p-2.5 md:p-3 bg-accent/30 rounded-xl border border-border/50 hover:bg-accent/50 transition-colors">
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground text-sm truncate">{chore.title}</div>
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+{chore.points} pts</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs shrink-0 ml-2 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                rotateChore(chore.id);
                                            }}
                                        >
                                            Done ✓
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Financial Forecast (Bills) */}
                <Card
                    className="group border-l-4 border-l-rose-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    onClick={() => navigate('/organizer')}
                >
                    <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-rose-500/10">
                                <DollarSign className="w-4 h-4 text-rose-500" />
                            </div>
                            <span>Financial Forecast</span>
                        </CardTitle>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </CardHeader>
                    <CardContent>
                        {upcomingBills.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2.5 rounded-full bg-rose-500/10 mb-2">
                                    <DollarSign className="w-5 h-5 text-rose-500" />
                                </div>
                                <span className="font-medium">You're good!</span>
                                <span className="text-xs mt-0.5">No bills due soon</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {upcomingBills.slice(0, 3).map(bill => {
                                    const daysUntil = Math.ceil((bill.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isCritical = daysUntil <= 2;

                                    return (
                                        <div key={bill.id} className="flex items-center justify-between p-2.5 md:p-3 bg-accent/30 rounded-xl border border-border/50">
                                            <div className="min-w-0">
                                                <div className="font-medium text-foreground text-sm truncate">{bill.name}</div>
                                                <div className={`text-xs ${isCritical ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                    {isCritical && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                                                    Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                            <div className="font-mono font-semibold text-foreground text-sm shrink-0 ml-2">${bill.amount}</div>
                                        </div>
                                    );
                                })}
                                {upcomingBills.length > 3 && (
                                    <p className="text-center text-xs text-muted-foreground pt-1">
                                        + {upcomingBills.length - 3} more
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Up Next Widget */}
                <Card
                    className="group border-l-4 border-l-sky-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    onClick={() => navigate('/planner')}
                >
                    <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base md:text-lg flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-sky-500/10">
                                <CalendarIcon className="w-4 h-4 text-sky-500" />
                            </div>
                            <span>Up Next</span>
                        </CardTitle>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </CardHeader>
                    <CardContent>
                        {upcomingEvents.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2.5 rounded-full bg-sky-500/10 mb-2">
                                    <CalendarIcon className="w-5 h-5 text-sky-500" />
                                </div>
                                <span className="font-medium">Free & clear</span>
                                <span className="text-xs mt-0.5">No upcoming events</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {upcomingEvents.map(evt => (
                                    <div key={evt.id} className="flex items-start gap-3 p-2.5 md:p-3 bg-accent/30 hover:bg-accent/50 transition-colors rounded-xl border border-border/50">
                                        <div className="w-1 shrink-0 self-stretch bg-sky-500 rounded-full" />
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground text-sm truncate">{evt.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Unread Messages */}
                <Card
                    className="group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-250 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    onClick={() => navigate('/messenger')}
                >
                    <CardContent className="h-full flex items-center gap-4 p-5 md:p-6">
                        <div className="relative group/icon shrink-0">
                            <div className="p-3 rounded-2xl bg-primary/10 transition-transform group-hover/icon:scale-105">
                                <MessageSquare className="w-8 h-8 text-primary" />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full border-2 border-card shadow-sm animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-3xl font-bold text-foreground">{unreadCount}</div>
                            <div className="text-muted-foreground text-sm font-medium">Unread Messages</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                                {unreadCount > 0 ? 'Tap to check your inbox →' : 'All caught up ✓'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Section: Leaderboard + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Real Leaderboard */}
                <div className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <Leaderboard />
                </div>

                {/* Right Column: Weather + Mood */}
                <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
                    {/* Weather */}
                    <Card>
                        <CardContent className="flex items-center gap-4 p-5 md:p-6">
                            <CloudSun className="w-12 h-12 text-amber-400 drop-shadow-sm shrink-0" />
                            <div>
                                <div className="text-3xl font-bold text-foreground">72°</div>
                                <div className="text-muted-foreground text-sm font-medium">Partly Cloudy</div>
                                <div className="text-xs text-muted-foreground mt-0.5">H: 78° • L: 65°</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Mood Check-in */}
                    <Card>
                        <CardHeader className="pb-3">
                            <h3 className="text-sm font-medium text-muted-foreground text-center">Quick Mood Check-in</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-around items-center">
                                <button
                                    onClick={() => handleMood('bad')}
                                    className="flex flex-col items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-2 transition-transform active:scale-95"
                                >
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-destructive/10 group-hover:border-destructive/50 transition-all shadow-sm">
                                        <Frown className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground group-hover:text-destructive transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Rough</span>
                                </button>
                                <button
                                    onClick={() => handleMood('neutral')}
                                    className="flex flex-col items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-2 transition-transform active:scale-95"
                                >
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/50 transition-all shadow-sm">
                                        <Meh className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Okay</span>
                                </button>
                                <button
                                    onClick={() => handleMood('good')}
                                    className="flex flex-col items-center gap-1.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-2 transition-transform active:scale-95"
                                >
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 transition-all shadow-sm">
                                        <Smile className="w-6 h-6 md:w-7 md:h-7 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Great</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <PushPermissionDialog
                isOpen={showPushPrompt}
                onClose={() => {
                    setShowPushPrompt(false);
                    // Don't show again for 7 days if dismissed
                    localStorage.setItem('sfos-push-prompt-dismissed', Date.now().toString());
                }}
            />
        </div>
    );
}
