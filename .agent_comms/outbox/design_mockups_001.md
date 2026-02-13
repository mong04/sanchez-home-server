# Design Mockups: Hybrid Budgeting UI

## 1. Envelope Card Design

The "Envelope" is the core unit of the budgeting system. It needs to be instantly readable and provide "Safe to Spend" status at a glance.

### Visual Wireframe (Standard State)

```text
+-------------------------------------------------------+
|  [ ICON ]  Groceries                          $150.00 |  <-- "Safe to Spend" (Green if > 0)
|                                                       |
|  [==========================              ]           |  <-- Progress Bar (70% filled)
|                                                       |
|  Spent: $350.00                       Limit: $500.00  |
+-------------------------------------------------------+
```

### Visual Wireframe (Hidden/Private State)

```text
+-------------------------------------------------------+
|  [ LOCK ]  Private Envelope                           |
|                                                       |
|  [////////////////////////////////////////]           |  <-- Blurred/Greyed out progress
|                                                       |
|  Tap to Reveal                                        |
+-------------------------------------------------------+
```

### Tailwind CSS Recommendations

We'll use the project's semantic tokens (presumed based on `baseline-ui` and standard practices).

**Container**:
`bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4 relative overflow-hidden`

**Header**:
- **Name**: `font-semibold text-lg flex items-center gap-2`
- **Safe Amount**: `font-bold text-xl tabular-nums`
  - Color Logic: `text-emerald-600` (Safe) vs `text-rose-600` (Overbudget)

**Progress Bar**:
- **Track**: `h-3 w-full bg-secondary rounded-full mt-3 mb-1 overflow-hidden`
- **Fill**: `h-full rounded-full transition-all duration-500`
  - Color Logic:
    - < 80%: `bg-primary`
    - 80-99%: `bg-amber-500`
    - 100%+: `bg-rose-500`

**Meta Info (Footer)**:
`flex justify-between text-sm text-muted-foreground font-medium mt-2`

### Component Logic (React Pseudo-code)

```tsx
const EnvelopeCard = ({ name, icon, spent, limit, isPrivate, isRevealed }) => {
  const safeToSpend = limit - spent;
  const progress = Math.min((spent / limit) * 100, 100);

  if (isPrivate && !isRevealed) {
    return (
      <div className="bg-card/50 border border-dashed border-border p-4 rounded-xl flex items-center justify-center gap-2 text-muted-foreground">
        <LockIcon className="w-5 h-5" />
        <span className="italic">Hidden Envelope</span>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="w-6 h-6 text-primary" />
          <h3 className="font-semibold text-lg hover:underline cursor-pointer">{name}</h3>
        </div>
        <div className={cn("text-xl font-bold", safeToSpend >= 0 ? "text-emerald-600" : "text-rose-600")}>
          ${safeToSpend.toFixed(2)}
        </div>
      </div>
      
      {/* Progress */}
      <div className="relative pt-4 pb-2">
        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all", getProgressColor(progress))} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wide font-medium">
        <span>Spent: ${spent}</span>
        <span>Limit: ${limit}</span>
      </div>
    </div>
  );
}
```

---
