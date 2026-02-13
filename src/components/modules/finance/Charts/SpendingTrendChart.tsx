import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format, eachDayOfInterval, isSameDay, startOfDay } from 'date-fns';
import type { TransactionRecord } from '../../../../types/pocketbase';
import { cn } from '../../../../lib/utils';

interface SpendingTrendChartProps {
    transactions: TransactionRecord[];
    totalBudget: number;
    startDate: Date;
    endDate: Date;
    className?: string;
}

export function SpendingTrendChart({
    transactions,
    totalBudget,
    startDate,
    endDate,
    className,
}: SpendingTrendChartProps) {
    const data = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        let cumulativeSpending = 0;

        return days.map((day, index) => {
            const dayTransactions = transactions.filter((t) =>
                isSameDay(startOfDay(new Date(t.date)), startOfDay(day))
            );
            const dailyTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
            cumulativeSpending += dailyTotal;

            const totalDays = days.length;
            const idealSpending = (totalBudget / totalDays) * (index + 1);

            return {
                date: format(day, 'MMM d'),
                Actual: cumulativeSpending,
                Ideal: idealSpending,
            };
        });
    }, [transactions, totalBudget, startDate, endDate]);

    return (
        <div className={cn("w-full h-[300px]", className)}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, undefined]}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '0.5rem',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Ideal" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" dot={false} activeDot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="Actual" stroke="hsl(var(--primary))" activeDot={{ r: 6 }} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
