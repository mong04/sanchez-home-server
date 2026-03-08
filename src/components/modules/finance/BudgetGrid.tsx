// src/components/modules/finance/BudgetGrid.tsx
// Orchestrator: hooks + three-breakpoint rendering + modal coordination.
// Business logic lives in useBudgetGridData. Modal state is local to each modal.
//
// Decomposed per react-specialist: "Single Responsibility", "Colocate State"
// Optimized per vercel-react-best-practices: "rerender-defer-reads", "rerender-memo"

import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useBudgetGridData } from '../../../hooks/useBudgetGridData';
import type { CategoryRecord } from '../../../types/pocketbase';
import { Card } from '../../common/Card';
import { Plus } from 'lucide-react';
import { Button } from '../../common/Button';
import { getGroupIdForCategory } from './budget/BudgetGroupHeader';

// Budget sub-components
import { BudgetSummaryBar } from './budget/BudgetSummaryBar';
import { BudgetGroupHeader, BudgetGroupRows } from './budget/BudgetGroupHeader';
import { BudgetSkeletonLoader } from './budget/BudgetSkeletonLoader';
import { BudgetEmptyState } from './budget/BudgetEmptyState';
import { BudgetCategoryRow } from './budget/BudgetCategoryRow';
import { BudgetCategoryCard } from './budget/BudgetCategoryCard';
import { BudgetTabletCategoryCard } from './budget/BudgetTabletCategoryCard';
import { BudgetBottomSheet } from './budget/BudgetBottomSheet';

// Modal sub-components (each owns its own form state)
import { FixOverspendModal } from './budget/FixOverspendModal';
import { MarkPaidModal } from './budget/MarkPaidModal';
import { CreateCategoryModal } from './budget/CreateCategoryModal';
import { EditCategoryModal } from './budget/EditCategoryModal';
import { DeleteCategoryModal } from './budget/DeleteCategoryModal';



interface BudgetGridProps {
    month: string; // "YYYY-MM" format
}

export function BudgetGrid({ month }: BudgetGridProps) {
    // ─── All data from custom hook ───
    const data = useBudgetGridData(month);
    const {
        categories,
        isLoading,
        accounts,
        localAllocations,
        spentByCategory,
        totalBudgeted,
        totalSpent,
        toBeBudgeted,
        groupedCategories,
        activeGroups,
        collapsedGroups,
        toggleGroup,
        categoryGroupOverrides,
        setCategoryGroupOverrides,
        getEffectiveGroupId,
        getCategoryData,
        orderedCategories,
        isMobile,
        isTablet,
        focusRow,
        handleAllocationChange,
        setAllocation,
        deleteCategory,
        updateCategory,
        createCategory,
        addTransaction,
        getRecurringForCategory,
        markAsPaidThisMonth,
    } = data;

    // ─── Modal coordination state (which modal is open + selected category) ───
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
    const [deletePendingCat, setDeletePendingCat] = useState<CategoryRecord | null>(null);
    const [fixCategory, setFixCategory] = useState<CategoryRecord | null>(null);
    const [markPaidCategory, setMarkPaidCategory] = useState<CategoryRecord | null>(null);

    // ─── Mobile bottom sheet state ───
    const [sheetCat, setSheetCat] = useState<CategoryRecord | null>(null);
    const openSheet = useCallback((cat: CategoryRecord) => {
        setSheetCat(cat);
    }, []);

    // ─── Icon emoji popover state (desktop only) ───
    const [iconPopoverCatId, setIconPopoverCatId] = useState<string | null>(null);
    const iconPopoverRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!iconPopoverCatId) return;
        const handler = (e: MouseEvent) => {
            if (iconPopoverRef.current && !iconPopoverRef.current.contains(e.target as Node)) {
                setIconPopoverCatId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [iconPopoverCatId]);

    // ─── Callbacks for child components ───
    const handleEditName = useCallback((cat: CategoryRecord) => {
        setEditingCategory(cat);
    }, []);

    const handleDeleteCategory = useCallback((catId: string) => {
        const cat = categories?.find((c) => c.id === catId) ?? null;
        setDeletePendingCat(cat);
    }, [categories]);

    const handleFix = useCallback((cat: CategoryRecord) => {
        setFixCategory(cat);
    }, []);

    const handleOpenMarkPaid = useCallback((cat: CategoryRecord) => {
        setMarkPaidCategory(cat);
    }, []);

    const handleCover = useCallback((donorCatId: string, amount: number) => {
        if (!fixCategory) return;
        const fixCatBudgeted = localAllocations[fixCategory.id] || 0;
        const donorBudgeted = localAllocations[donorCatId] || 0;
        setAllocation(fixCategory.id, fixCatBudgeted + amount);
        setAllocation(donorCatId, Math.max(0, donorBudgeted - amount));
        setFixCategory(null);
    }, [fixCategory, localAllocations, setAllocation]);

    const handleConfirmMarkPaid = useCallback(async (categoryId: string, splits: { accountId: string; amount: number }[]) => {
        const cat = categories?.find((c) => c.id === categoryId);
        if (!cat) return;
        const splitGroupId = splits.length > 1 ? crypto.randomUUID() : undefined;
        for (const split of splits) {
            if (split.amount <= 0 || !split.accountId) continue;
            await addTransaction.mutateAsync({
                date: new Date().toISOString(),
                amount: -Math.abs(split.amount),
                category: categoryId,
                account: split.accountId,
                payee: `${cat.name} Payment`,
                cleared: true,
                type: 'normal',
                notes: splits.length > 1 ? 'Split Payment' : undefined,
                splitGroupId,
            });
        }
        markAsPaidThisMonth(categoryId, month);
    }, [categories, addTransaction, markAsPaidThisMonth, month]);

    const handleEditCommit = useCallback((
        categoryId: string,
        name: string,
        icon: string,
        groupId: string,
        isGoal: boolean,
        isRecurring: boolean,
        amount: number,
        frequency: 'monthly' | 'quarterly' | 'yearly' | undefined,
        dueDay: number | undefined,
        startDate: string
    ) => {
        const data: Partial<CategoryRecord> = { name, icon };

        if (isRecurring) {
            data.isRecurring = true;
            data.amount = amount;
            data.frequency = frequency;
            data.dueDay = dueDay;
            data.startDate = startDate;
        } else if (isGoal) {
            data.isRecurring = false;
            data.amount = amount;
            data.frequency = undefined;
            data.dueDay = undefined;
            data.startDate = startDate;
        } else {
            data.isRecurring = false;
            data.amount = 0;
            data.frequency = undefined;
            data.dueDay = undefined;
            data.startDate = '';
        }

        updateCategory.mutate({ id: categoryId, data });
        // Save group override if changed from auto-detected
        const autoGroup = getGroupIdForCategory(name);
        if (groupId !== autoGroup || categoryGroupOverrides[categoryId]) {
            setCategoryGroupOverrides((prev) => ({ ...prev, [categoryId]: groupId }));
        }
    }, [updateCategory, categoryGroupOverrides, setCategoryGroupOverrides, categories]);

    const handleCreateCategory = useCallback(async (catData: Partial<CategoryRecord>) => {
        await createCategory.mutateAsync(catData);
    }, [createCategory]);

    // ─── Loading state ───
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-32 px-4">
                <div className="flex justify-end">
                    <div className="h-9 w-44 bg-muted animate-pulse rounded-xl" />
                </div>
                <Card className="overflow-hidden h-[calc(100dvh-250px)] lg:h-[calc(100dvh-190px)]">
                    <BudgetSkeletonLoader rows={8} />
                </Card>
            </div>
        );
    }

    // ─── Render ───
    return (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-32">

            {/* Empty state */}
            {!categories || categories.length === 0 ? (
                <BudgetEmptyState onAddCategory={() => setCreateModalOpen(true)} />
            ) : (
                <div className="flex flex-col gap-3">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-1">
                        <p className="text-xs text-muted-foreground font-medium hidden md:block">
                            {categories.length} categories
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateModalOpen(true)}
                            className="ml-auto shadow-sm min-h-[44px] md:min-h-0 bg-card gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            Add Category or Bill
                        </Button>
                    </div>

                    {/* ─── Mobile: Card List ─── */}
                    {isMobile && (
                        <div className="flex flex-col gap-3 px-1">
                            {/* Sticky summary bar for mobile */}
                            <div className="sticky top-[64px] z-20 -mx-1 px-1 pb-2 bg-background/95 backdrop-blur-sm shadow-sm md:shadow-none">
                                <BudgetSummaryBar
                                    totalBudgeted={totalBudgeted}
                                    totalSpent={totalSpent}
                                    toBeBudgeted={toBeBudgeted ?? 0}
                                    className="rounded-2xl border border-border shadow-sm overflow-hidden"
                                />
                            </div>
                            {activeGroups.map((group) => {
                                const cats = groupedCategories.get(group.id) || [];
                                const isCollapsed = collapsedGroups[group.id] ?? false;
                                const groupBudgeted = cats.reduce((s, c) => s + (localAllocations[c.id] || 0), 0);
                                const groupSpent = cats.reduce((s, c) => s + Math.abs(spentByCategory[c.id] || 0), 0);
                                return (
                                    <div key={group.id} className="flex flex-col gap-2">
                                        <BudgetGroupHeader
                                            group={group}
                                            isCollapsed={isCollapsed}
                                            onToggle={() => toggleGroup(group.id)}
                                            totalBudgeted={groupBudgeted}
                                            totalSpent={groupSpent}
                                            count={cats.length}
                                            className="rounded-2xl border border-border"
                                        />
                                        <BudgetGroupRows groupId={group.id} isCollapsed={isCollapsed}>
                                            <div className="flex flex-col gap-2 pt-1">
                                                {cats.map((cat) => {
                                                    const d = getCategoryData(cat);
                                                    return (
                                                        <BudgetCategoryCard
                                                            key={cat.id}
                                                            category={cat}
                                                            budgeted={d.budgeted}
                                                            activity={d.activity}
                                                            finalAvailable={d.finalAvailable}
                                                            isOverspent={d.isOverspent}
                                                            isUnderGoal={d.isUnderGoal}
                                                            isRecurring={d.isRecurring}
                                                            isPaid={d.isPaid}
                                                            dueText={d.dueText}
                                                            recurringConfig={d.recurringConfig}
                                                            isGoal={d.isGoal}
                                                            targetAmount={d.targetAmount}
                                                            goalProgress={d.goalProgress}
                                                            isMobile={true}
                                                            onAllocationChange={handleAllocationChange}
                                                            onTap={openSheet}
                                                            onEditName={handleEditName}
                                                            onDelete={handleDeleteCategory}
                                                            onMarkPaid={handleOpenMarkPaid}
                                                            onFix={handleFix}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </BudgetGroupRows>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── Tablet: Enhanced Card-Row List (kitchen iPad) ─── */}
                    {isTablet && (
                        <div className="flex flex-col gap-3 px-1">
                            {/* Sticky summary bar for tablet */}
                            <div className="sticky top-[64px] z-20 -mx-1 px-1 pb-2 bg-background/95 backdrop-blur-sm">
                                <BudgetSummaryBar
                                    totalBudgeted={totalBudgeted}
                                    totalSpent={totalSpent}
                                    toBeBudgeted={toBeBudgeted ?? 0}
                                    className="rounded-2xl border border-border shadow-sm overflow-hidden"
                                />
                            </div>
                            {activeGroups.map((group) => {
                                const cats = groupedCategories.get(group.id) || [];
                                const isCollapsed = collapsedGroups[group.id] ?? false;
                                const groupBudgeted = cats.reduce((s, c) => s + (localAllocations[c.id] || 0), 0);
                                const groupSpent = cats.reduce((s, c) => s + Math.abs(spentByCategory[c.id] || 0), 0);
                                return (
                                    <div key={group.id} className="flex flex-col gap-2">
                                        <BudgetGroupHeader
                                            group={group}
                                            isCollapsed={isCollapsed}
                                            onToggle={() => toggleGroup(group.id)}
                                            totalBudgeted={groupBudgeted}
                                            totalSpent={groupSpent}
                                            count={cats.length}
                                            className="rounded-2xl border border-border"
                                        />
                                        <BudgetGroupRows groupId={group.id} isCollapsed={isCollapsed}>
                                            <div className="flex flex-col gap-2.5 pt-1">
                                                {cats.map((cat) => {
                                                    const d = getCategoryData(cat);
                                                    return (
                                                        <BudgetTabletCategoryCard
                                                            key={cat.id}
                                                            category={cat}
                                                            budgeted={d.budgeted}
                                                            activity={d.activity}
                                                            finalAvailable={d.finalAvailable}
                                                            isOverspent={d.isOverspent}
                                                            isUnderGoal={d.isUnderGoal}
                                                            isRecurring={d.isRecurring}
                                                            isPaid={d.isPaid}
                                                            dueText={d.dueText}
                                                            recurringConfig={d.recurringConfig}
                                                            isGoal={d.isGoal}
                                                            targetAmount={d.targetAmount}
                                                            goalProgress={d.goalProgress}
                                                            onAllocationChange={handleAllocationChange}
                                                            onEditName={handleEditName}
                                                            onDelete={handleDeleteCategory}
                                                            onMarkPaid={handleOpenMarkPaid}
                                                            onFix={handleFix}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </BudgetGroupRows>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ─── Desktop: Full Semantic Table (natural page scroll) ─── */}
                    {!isMobile && !isTablet && (
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-visible">
                            {/* Sticky header row */}
                            <div
                                role="row"
                                className="grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-border/50 bg-card/95 backdrop-blur-md text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-[64px] z-30 shadow-sm rounded-t-2xl"
                            >
                                <div role="columnheader" className="col-span-4 pl-12">Category</div>
                                <div role="columnheader" className="col-span-3 text-right">Budgeted</div>
                                <div role="columnheader" className="col-span-2 text-right">Spent</div>
                                <div role="columnheader" className="col-span-3 text-right pr-1">Available</div>
                            </div>

                            {/* Sticky summary bar */}
                            <div className="sticky top-[104px] z-20">
                                <BudgetSummaryBar
                                    totalBudgeted={totalBudgeted}
                                    totalSpent={totalSpent}
                                    toBeBudgeted={toBeBudgeted ?? 0}
                                />
                            </div>

                            {/* Rows */}
                            <div role="grid" aria-label="Budget categories" className="w-full relative">
                                <AnimatePresence>
                                    {activeGroups.map((group) => {
                                        const cats = groupedCategories.get(group.id) || [];
                                        const isCollapsed = collapsedGroups[group.id] ?? false;
                                        const groupBudgeted = cats.reduce((s, c) => s + (localAllocations[c.id] || 0), 0);
                                        const groupSpent = cats.reduce((s, c) => s + Math.abs(spentByCategory[c.id] || 0), 0);
                                        return (
                                            <div key={group.id} role="rowgroup">
                                                <BudgetGroupHeader
                                                    group={group}
                                                    isCollapsed={isCollapsed}
                                                    onToggle={() => toggleGroup(group.id)}
                                                    totalBudgeted={groupBudgeted}
                                                    totalSpent={groupSpent}
                                                    count={cats.length}
                                                />
                                                <BudgetGroupRows groupId={group.id} isCollapsed={isCollapsed}>
                                                    {cats.map((cat) => {
                                                        const d = getCategoryData(cat);
                                                        const globalIdx = orderedCategories.indexOf(cat);
                                                        return (
                                                            <BudgetCategoryRow
                                                                key={cat.id}
                                                                category={cat}
                                                                budgeted={d.budgeted}
                                                                activity={d.activity}
                                                                finalAvailable={d.finalAvailable}
                                                                isOverspent={d.isOverspent}
                                                                isUnderGoal={d.isUnderGoal}
                                                                isRecurring={d.isRecurring}
                                                                isPaid={d.isPaid}
                                                                dueText={d.dueText}
                                                                recurringConfig={d.recurringConfig}
                                                                isGoal={d.isGoal}
                                                                targetAmount={d.targetAmount}
                                                                goalProgress={d.goalProgress}
                                                                onIconClick={(id) => setIconPopoverCatId(iconPopoverCatId === id ? null : id)}
                                                                iconPopoverCatId={iconPopoverCatId}
                                                                iconPopoverRef={iconPopoverRef}
                                                                onIconSelect={(id, emoji) => {
                                                                    updateCategory.mutate({ id, data: { icon: emoji } });
                                                                    setIconPopoverCatId(null);
                                                                }}
                                                                onAllocationChange={handleAllocationChange}
                                                                onEditName={handleEditName}
                                                                onDelete={handleDeleteCategory}
                                                                onMarkPaid={handleOpenMarkPaid}
                                                                onFix={handleFix}
                                                                rowIndex={globalIdx}
                                                                totalRows={orderedCategories.length}
                                                                onFocusRow={focusRow}
                                                                month={month}
                                                            />
                                                        );
                                                    })}
                                                </BudgetGroupRows>
                                            </div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Mobile Bottom Sheet ─── */}
            {sheetCat && (() => {
                const d = getCategoryData(sheetCat);
                return (
                    <BudgetBottomSheet
                        isOpen={!!sheetCat}
                        onClose={() => setSheetCat(null)}
                        category={sheetCat}
                        budgeted={d.budgeted}
                        spent={Math.abs(d.activity)}
                        onAllocationChange={handleAllocationChange}
                        recurringConfig={d.recurringConfig}
                        isPaid={d.isPaid}
                        isRecurring={d.isRecurring}
                        onMarkPaid={() => {
                            setSheetCat(null);
                            handleOpenMarkPaid(sheetCat);
                        }}
                    />
                );
            })()}

            {/* ─── Modals ─── */}
            <FixOverspendModal
                isOpen={!!fixCategory}
                onClose={() => setFixCategory(null)}
                overspentCat={fixCategory}
                categories={categories || []}
                localAllocations={localAllocations}
                spentByCategory={spentByCategory}
                onCover={handleCover}
            />

            {markPaidCategory && (
                <MarkPaidModal
                    isOpen={!!markPaidCategory}
                    onClose={() => setMarkPaidCategory(null)}
                    categoryId={markPaidCategory.id}
                    categoryName={markPaidCategory.name}
                    recurringConfig={getRecurringForCategory(markPaidCategory.id, markPaidCategory)}
                    categoryAmount={markPaidCategory.amount || 0}
                    accounts={accounts}
                    onConfirm={handleConfirmMarkPaid}
                />
            )}

            <CreateCategoryModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreateCategory={handleCreateCategory}
                isPending={createCategory.isPending}
            />

            <EditCategoryModal
                isOpen={!!editingCategory}
                onClose={() => setEditingCategory(null)}
                category={editingCategory}
                onCommit={handleEditCommit}
                isPending={updateCategory.isPending}
                getEffectiveGroupId={getEffectiveGroupId}
            />

            <DeleteCategoryModal
                isOpen={!!deletePendingCat}
                onClose={() => setDeletePendingCat(null)}
                category={deletePendingCat}
                onConfirmDelete={(catId) => deleteCategory.mutate(catId)}
                isPending={deleteCategory.isPending}
            />
        </div>
    );
}
