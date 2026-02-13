# Desktop Finance UI Design
**Reference**: Phase 4 "The CFO" Desktop Interface
## 1. Budget Allocation Grid
A high-density, spreadsheet-like view for managing envelope limits efficiently. Designed for the "CFO" persona who needs to adjust budget numbers rapidly.
### Visual Mockup (Desktop)
```text
+---------------------------------------------------------------------------------------+
|  Budget Allocation (Joint)                                          [  Cancel  ] [ Save  ] |
+---------------------------------------------------------------------------------------+
|  Category          | Current Balance     | New Limit ($)      | Rollover? | Trend        |
+---------------------------------------------------------------------------------------+
|  Groceries         | $450.00             | [ 600.00 ]         | [x]       |  (--o--)     |
|  Dining Out        | $120.50             | [ 200.00 ]         | [ ]       |  (o----)     |
|  Utilities         | $(15.00) (!)        | [ 300.00 ]         | [x]       |  (-----)     |
|  Mortgage          | $2,400.00           | [ 2400.00]         | [x]       |  (FIXED)     |
|  Entertainment     | $85.00              | [ 150.00 ]         | [ ]       |  (--o--)     |
|  ...               | ...                 | ...                | ...       |  ...         |
+---------------------------------------------------------------------------------------+
|  TOTAL             | $3,040.50           | $3,650.00          |           |              |
+---------------------------------------------------------------------------------------+
```
### Component Structure & Tailwind Classes
Usage of `w-full`, `border-collapse`, and semantic tabular nums.
```tsx
<div className="rounded-md border bg-card">
  <div className="overflow-x-auto">
    <table className="w-full caption-bottom text-sm text-left">
      <thead className="[&_tr]:border-b">
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
          <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[200px]">Category</th>
          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Balance</th>
          <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[150px]">New Limit</th>
          <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[100px]">Rollover</th>
          <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Trend</th>
        </tr>
      </thead>
      <tbody className="[&_tr:last-child]:border-0">
        {envelopes.map((env) => (
          <tr key={env.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {/* Category Name */}
            <td className="p-4 align-middle font-medium text-foreground">
              {env.name}
            </td>
            
            {/* Balance with Over Budget Indicator */}
            <td className="p-4 align-middle">
              <span className={cn(
                "font-variant-numeric: tabular-nums",
                env.balance < 0 ? "text-destructive font-bold" : "text-foreground"
              )}>
                {formatCurrency(env.balance)}
                {env.balance < 0 && <AlertCircle className="inline ml-2 w-4 h-4" />}
              </span>
            </td>
            {/* Editable Limit Input */}
            <td className="p-4 align-middle">
               <Input 
                 type="number" 
                 className="h-8 w-full text-right font-mono" 
                 defaultValue={env.limit}
               />
            </td>
            {/* Rollover Toggle */}
            <td className="p-4 align-middle text-center">
              <Switch checked={env.rollover} size="sm" />
            </td>
            {/* Mini Trend Line (Sparkline placeholder) */}
            <td className="p-4 align-middle text-muted-foreground text-xs">
              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 w-[70%]" />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```
**Interaction Notes**:
- **Keyboard Navigation**: Users must be able to Tab through the "New Limit" inputs vertically (or Z-pattern) to update the budget quickly.
- **Dirty State**: Show a "Save Changes" floating action bar or header button when values are modified.
## 2. Insights Dashboard
A "Cockpit" view for high-level financial health.
### Layout Strategy
Use a CSS Grid layout that adapts from 1 column (mobile) to 3 columns (desktop).
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Priority Widget: Safe-to-Spend */}
  <section className="col-span-1 md:col-span-3 lg:col-span-1">
    <SafeToSpendWidget />
  </section>
  {/* Charts Section */}
  <section className="col-span-1 md:col-span-3 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
    <SpendingTrendChart /> {/* Line Chart */}
    <CategoryBreakdownChart /> {/* Donut Chart */}
  </section>
</div>
```
### Component: Safe-to-Spend Widget
Prominent display of "Unallocated" or "Free" funds.
**Visuals**:
- Large Topography number.
- Color encoded: Green (Healthy), Yellow (Low), Red (Negative).
- Subtext: "Daily budget remaining: $X.XX"
```tsx
<Card className="h-full border-l-4 border-l-primary">
  <CardHeader>
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Safe to Spend
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-4xl font-bold tracking-tight">
      $1,240.50
    </div>
    <p className="text-xs text-muted-foreground mt-2">
      + $450.00 since last week
    </p>
    <div className="mt-4 h-2 w-full bg-secondary rounded-full">
      <div className="h-full bg-primary w-[65%]" />
    </div>
    <p className="text-[10px] text-muted-foreground text-right mt-1">
      65% of monthly income allocated
    </p>
  </CardContent>
</Card>
```
## Summary of Design Decisions
- **Density**: The Allocation Grid uses `h-10` rows and compact inputs to fit more data on screen (See `web-design-guidelines` 2.5 - targets are still accessible).
- **Semantics**: Using native `<table>` for the grid ensures accessibility (row navigation, screen readers).
- **Colors**: Relying on generic semantic tokens (`destructive`, `muted`, `primary`) ensures theme compatibility (Dark/Light mode).
- **Typography**: Tabular numbers (`font-variant-numeric: tabular-nums`) essential for alignment of financial data.
