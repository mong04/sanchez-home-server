import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
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
                <Card
                    className="border-l-4 border-l-emerald-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/organizer')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            <span>Today's Mission</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeChores.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2 rounded-full bg-emerald-500/10 mb-2">
                                    <Smile className="w-6 h-6 text-emerald-500" />
                                </div>
                                No active chores! 🎉
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeChores.map(chore => (
                                    <div key={chore.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors">
                                        <div>
                                            <div className="font-medium text-foreground">{chore.title}</div>
                                            <div className="text-xs text-emerald-600 dark:text-emerald-400">+{chore.points} pts</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 text-xs hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                rotateChore(chore.id);
                                            }}
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
                <Card
                    className="border-l-4 border-l-rose-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/organizer')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-rose-500" />
                            <span>Financial Forecast</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {upcomingBills.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2 rounded-full bg-rose-500/10 mb-2">
                                    <DollarSign className="w-6 h-6 text-rose-500" />
                                </div>
                                No bills due soon.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingBills.slice(0, 3).map(bill => {
                                    const daysUntil = Math.ceil((bill.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
                                    const isCritical = daysUntil <= 2;

                                    return (
                                        <div key={bill.id} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border/50">
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
                                    <div className="text-center text-xs text-muted-foreground pt-2 cursor-pointer hover:text-primary transition-colors">
                                        + {upcomingBills.length - 3} more bills
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Family Scoreboard */}
                <Card
                    className="border-l-4 border-l-amber-500 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/organizer')}
                >
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <span>Family Scoreboard</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                <div className="p-2 rounded-full bg-amber-500/10 mb-2">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                </div>
                                No points yet. Start doing chores!
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {leaderboard.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center justify-between group">
                                        <div className="flex items-center space-x-3">
                                            <div className={`
                                                w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shadow-sm transition-transform group-hover:scale-110
                                                ${index === 0 ? 'bg-amber-400 text-amber-900 ring-2 ring-amber-400/50' :
                                                    index === 1 ? 'bg-slate-300 dark:bg-slate-400 text-slate-800' :
                                                        index === 2 ? 'bg-orange-700 text-orange-100' : 'bg-secondary text-muted-foreground'}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <span className="text-foreground font-medium capitalize">
                                                {entry.name === CURRENT_USER_ID ? "Dad (You)" : entry.name}
                                            </span>
                                        </div>
                                        <div className="font-mono font-semibold text-lg text-amber-600 dark:text-amber-400">{entry.points} pts</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Weather Widget */}
                <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <CloudSun className="w-16 h-16 text-amber-400 drop-shadow-md animate-pulse" style={{ animationDuration: '3s' }} />
                        <div>
                            <div className="text-5xl font-bold text-foreground">72°</div>
                            <div className="text-muted-foreground font-medium mt-1">Partly Cloudy</div>
                            <div className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted rounded-full inline-block">H: 78° • L: 65°</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Up Next Widget */}
                <Card
                    className="col-span-1 md:col-span-2 lg:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/planner')}
                >
                    <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2 text-sky-500 dark:text-sky-400">
                            <CalendarIcon className="w-5 h-5" />
                            <h3 className="font-semibold tracking-wide uppercase text-xs">Up Next</h3>
                        </div>
                    </CardHeader>
                    <CardContent className="h-full">
                        <div className="space-y-4 h-full flex flex-col">
                            {upcomingEvents.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm italic min-h-[100px]">
                                    <CalendarIcon className="w-8 h-8 opacity-20 mb-2" />
                                    No upcoming events.
                                </div>
                            ) : (
                                upcomingEvents.map(evt => (
                                    <div key={evt.id} className="flex items-start space-x-3 p-3 bg-accent/30 hover:bg-accent/50 transition-colors rounded-xl border border-border/50">
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
                    </CardContent>
                </Card>

                {/* Unread Messages Widget */}
                <Card
                    className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/messenger')}
                >
                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="relative group">
                            <MessageSquare className="w-14 h-14 text-primary/80 transition-transform group-hover:scale-110 duration-300" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full border border-card shadow-sm animate-bounce">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-foreground">{unreadCount}</div>
                            <div className="text-muted-foreground font-medium">Unread Messages</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 border-t border-border pt-2 w-full">
                            {unreadCount > 0 ? "Check your inbox!" : "All caught up"}
                        </div>
                    </CardContent>
                </Card>

                {/* Mood Check-in */}
                <Card className="col-span-1 md:col-span-full lg:col-span-3 xl:col-span-1 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <CardHeader className="pb-4">
                        <h3 className="text-muted-foreground font-medium text-sm text-center">Quick Mood Check-in</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-around items-center">
                            <button
                                onClick={() => handleMood('bad')}
                                className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl p-2 transition-transform active:scale-95"
                            >
                                <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-destructive/10 group-hover:border-destructive/50 transition-all shadow-sm">
                                    <Frown className="w-7 h-7 text-muted-foreground group-hover:text-destructive transition-colors" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Rough</span>
                            </button>
                            <button
                                onClick={() => handleMood('neutral')}
                                className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl p-2 transition-transform active:scale-95"
                            >
                                <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/50 transition-all shadow-sm">
                                    <Meh className="w-7 h-7 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Okay</span>
                            </button>
                            <button
                                onClick={() => handleMood('good')}
                                className="flex flex-col items-center space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl p-2 transition-transform active:scale-95"
                            >
                                <div className="w-14 h-14 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 transition-all shadow-sm">
                                    <Smile className="w-7 h-7 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Great</span>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
