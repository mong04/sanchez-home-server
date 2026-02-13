# Dev Desktop Logic: Charts & Budget Allocation

## 1. Charting Library Recommendation
After evaluating options like `recharts`, `visx`, and `chart.js`, I recommend **`recharts`** for the Sanchez Family Finance Hub.

**Rationale**:
- **React Native Feel**: Uses a declarative component API that fits well with our React codebase.
- **Composition**: Easy to customize tooltips, axes, and legends.
- **Performance**: Good enough for our data scale (daily transactions for a year).
- **Bundle Size**: Tree-shakable (mostly).

## 2. Components Implemented

### [NEW] `SpendingTrendChart.tsx`
Visualizes cumulative spending against an "ideal" linear burn-down of the budget.

```tsx
import React, { useMemo } from 'react';
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
import { TransactionRecord } from '../../types/pocketbase';
import { cn } from '../../lib/utils';

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
                        formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
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
```

## 3. Logic & Hooks

### [NEW] `useBulkUpdateEnvelopes.ts`
Handles batch updates for envelope allocations. Since PocketBase lacks a native bulk update endpoint for arbitrary logic, we use `Promise.all` for parallelism.

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '../lib/pocketbase';
import { Collections, EnvelopeRecord } from '../types/pocketbase';

interface BulkUpdateEnvelopeParams {
    updates: { id: string; data: Partial<EnvelopeRecord> }[];
}

export function useBulkUpdateEnvelopes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ updates }: BulkUpdateEnvelopeParams) => {
            const promises = updates.map((update) =>
                pb.collection(Collections.Envelopes).update(update.id, update.data)
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [Collections.Envelopes] });
        },
    });
}
```

### [NEW] `budgetRollover.ts`
Utility for calculating the new available balance when a budget rolls over or is re-allocated.

```ts
/**
 * Calculates the available amount for an envelope based on rollover logic.
 * @param currentBalance The current balance of the envelope (can be negative).
 * @param allocationAmount The amount being added to the envelope.
 */
export function calculateRollover(currentBalance: number, allocationAmount: number): number {
    return currentBalance + allocationAmount;
}
```
