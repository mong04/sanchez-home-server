import { useCalendar } from '../../hooks/use-calendar';
import { useWellness } from '../../hooks/use-wellness';
import { useMessenger } from '../../hooks/use-messenger';
import { useChores, useBills } from '../../hooks/use-organizer';
import { CloudSun, Calendar as CalendarIcon, Smile, Frown, Meh, MessageSquare, CheckCircle, AlertTriangle, Trophy, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { format } from 'date-fns';

// MOCK: Hardcoded user ID for dashboard filtering as per Phase 7 reqs
const CURRENT_USER_ID = "dad-uuid";

export function CommandCenter() {
    const { events } = useCalendar();
    const { logEntry } = useWellness();
    const { messages } = useMessenger();
    const { getMyActiveChores, getFamilyLeaderboard, rotateChore } = useChores();
    const { getUpcomingBills } = useBills();

    const activeChores = getMyActiveChores(CURRENT_USER_ID);
    const leaderboard = getFamilyLeaderboard();
    const upcomingBills = getUpcomingBills(14); // Next 14 days

    // Calculate unread
    const lastRead = parseInt(localStorage.getItem('sfos-messenger-last-read') || '0', 10);
    const unreadCount = messages.filter(m => m.timestamp > lastRead).length;

    // Simple mock usage for "Up Next"
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">Good Evening, Sanchez Family</h2>
                    <p className="text-muted-foreground">Here is your daily briefing.</p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM do')}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Today's Mission (Chores) */}
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>Today's Mission</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeChores.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No active chores! 🎉
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeChores.map(chore => (
                                    <div key={chore.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                                        <div>
                                            <div className="font-medium text-foreground">{chore.title}</div>
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400">+{chore.points} pts</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50"
                                            onClick={() => rotateChore(chore.id)}
                                        >
                                            Complete
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Financial Forecast (Bills) */}
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-rose-500" />
                            <span>Financial Forecast</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingBills.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No bills due soon.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingBills.slice(0, 3).map(bill => {
                                    const daysUntil = Math.ceil((bill.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isCritical = daysUntil <= 2;

                                    return (
                                        <div key={bill.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                                            <div>
                                                <div className="font-medium text-foreground">{bill.name}</div>
                                                <div className={`text-xs ${isCritical ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}>
                                                    Due in {daysUntil} days
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-foreground">${bill.amount}</div>
                                                {isCritical && <AlertTriangle className="w-3 h-3 text-red-500 inline ml-1" />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {upcomingBills.length > 3 && (
                                    <div className="text-center text-xs text-muted-foreground pt-2">
                                        + {upcomingBills.length - 3} more bills
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Family Scoreboard */}
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <span>Family Scoreboard</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No points yet. Start doing chores!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`
                                                w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                                ${index === 0 ? 'bg-amber-500 text-black' :
                                                    index === 1 ? 'bg-slate-300 dark:bg-slate-400 text-black' :
                                                        index === 2 ? 'bg-orange-700 text-white' : 'bg-secondary text-muted-foreground'}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <span className="text-foreground font-medium capitalize">
                                                {entry.name === CURRENT_USER_ID ? "Dad (You)" : entry.name}
                                            </span>
                                        </div>
                                        <div className="font-mono text-amber-600 dark:text-amber-400">{entry.points} pts</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weather Widget (Mock) */}
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-accent transition-colors shadow-sm">
                    <CloudSun className="w-16 h-16 text-amber-400 mb-4" />
                    <div className="text-4xl font-bold text-foreground">72°</div>
                    <div className="text-muted-foreground font-medium">Partly Cloudy</div>
                    <div className="text-xs text-muted-foreground mt-2">H: 78° L: 65°</div>
                </div>

                {/* Up Next Widget */}
                <div className="bg-card border border-border rounded-2xl p-6 col-span-1 md:col-span-2 lg:col-span-1 flex flex-col shadow-sm">
                    <div className="flex items-center space-x-2 mb-4 text-sky-500 dark:text-sky-400">
                        <CalendarIcon className="w-5 h-5" />
                        <h3 className="font-semibold tracking-wide uppercase text-xs">Up Next</h3>
                    </div>
                    <div className="space-y-4 flex-1">
                        {upcomingEvents.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic">
                                No upcoming events.
                            </div>
                        ) : (
                            upcomingEvents.map(evt => (
                                <div key={evt.id} className="flex items-start space-x-3 p-3 bg-accent/50 rounded-xl border border-border/50">
                                    <div className="w-1 h-full bg-sky-500 rounded-full min-h-[40px]"></div>
                                    <div>
                                        <div className="font-medium text-foreground">{evt.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Unread Messages Widget */}
                <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-accent transition-colors shadow-sm">
                    <div className="relative">
                        <MessageSquare className="w-12 h-12 text-primary/70 mb-4" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full border border-card">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-foreground">{unreadCount}</div>
                    <div className="text-muted-foreground font-medium">Unread Messages</div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {unreadCount > 0 ? "Check your inbox!" : "All caught up"}
                    </div>
                </div>

                {/* Mood Check-in */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-muted-foreground font-medium mb-4 text-sm text-center">Quick Mood Check-in</h3>
                    <div className="flex justify-between items-center px-4">
                        <button
                            onClick={() => handleMood('bad')}
                            className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-destructive/10 group-hover:border-destructive/50 transition-all">
                                <Frown className="w-6 h-6 text-muted-foreground group-hover:text-destructive" />
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground">Rough</span>
                        </button>
                        <button
                            onClick={() => handleMood('neutral')}
                            className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/50 transition-all">
                                <Meh className="w-6 h-6 text-muted-foreground group-hover:text-amber-500" />
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground">Okay</span>
                        </button>
                        <button
                            onClick={() => handleMood('good')}
                            className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg p-2"
                        >
                            <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-green-500/10 group-hover:border-green-500/50 transition-all">
                                <Smile className="w-6 h-6 text-muted-foreground group-hover:text-green-500" />
                            </div>
                            <span className="text-xs text-muted-foreground group-hover:text-foreground">Great</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
