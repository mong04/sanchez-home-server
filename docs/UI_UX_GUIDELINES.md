# UI/UX & Theming Guidelines for Agents

**Target Audience:** AI Agents & Developers  
**Purpose:** Standardize component creation for the Sanchez Family OS (SFOS).

---

## 🎨 Core Philosophy
SFOS uses a **semantic theming system**. This means we style components based on *what they are* (e.g., "a card background"), not *what color they are* (e.g., "white" or "slate-900").

**Golden Rules:**
1.  **NEVER hardcode hex codes or specific color scales** (e.g., `bg-slate-50`, `text-gray-900`) for structural elements.
2.  **ALWAYS use semantic tokens** (e.g., `bg-card`, `text-foreground`).
3.  **ALWAYS support Light & Dark mode** implicitly via these tokens.
4.  **ALWAYS ensure Accessibility** (Focus rings, WCAG AA contrast).

---

## 🛠️ Theming System (Semantic Tokens)

These classes map to variables in `src/index.css`. Use them in your `className`.

### Backgrounds
- `bg-background`: The main page background.
- `bg-card`: For cards, modals, and isolated containers.
- `bg-popover`: For dropdowns, tooltips, and popovers.
- `bg-primary`: High-emphasis background (buttons, active states).
- `bg-secondary`: Low-emphasis background (tags, secondary buttons).
- `bg-muted`: Subtle backgrounds (table headers, skeletons).
- `bg-accent`: Interactive hover states (dropdown items).

### Text (Foregrounds)
- `text-foreground`: Primary body text.
- `text-muted-foreground`: Secondary/Hint text.
- `text-primary-foreground`: Text sitting on top of `bg-primary`.
- `text-secondary-foreground`: Text sitting on top of `bg-secondary`.
- `text-destructive-foreground`: Text sitting on top of `bg-destructive`.

### Borders & Dividers
- `border-border`: Default border color for cards and inputs.
- `border-input`: Specific border for form inputs.

### Status & Feedback
- `text-destructive` / `bg-destructive`: Errors, deletions, critical alerts.
- `ring-ring`: Focus ring color.

---

## 🧱 Component Construction Kit

When building a new component, follow this exact pattern.

### 1. Structure
- Use `React.forwardRef` to allow ref passing.
- Accept `className` and merge it using the `cn()` utility.
- Use explicit types.

### 2. Boilerplate Code
```tsx
import * as React from "react"
import { cn } from "@/lib/utils" // Ensure correct import path

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline"
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
            // 1. Base Layout
            "rounded-xl border p-4 shadow-sm transition-colors",
            
            // 2. Semantic Colors (Theming)
            "bg-card text-card-foreground border-border",
            
            // 3. Accessibility Focus Ring (CRITICAL)
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            
            // 4. Variant Logic (if needed)
            variant === "outline" && "bg-transparent border-dashed",
            
            // 5. Custom Overrides
            className
        )}
        {...props}
      />
    )
  }
)
MyComponent.displayName = "MyComponent"

export { MyComponent }
```

---

## ✅ Accessibility Checklist (Do Not Skip)

Every interactive element needs to pass this check:

1.  **[ ] Focus Indicators**: Does it have `focus-visible:ring-ring`?
    - Failure to add this makes the app unusable for keyboard users.
2.  **[ ] Contrast**: Are you using `text-foreground` on `bg-background` or `bg-card`?
    - Avoid `text-gray-400` on white; use `text-muted-foreground`.
3.  **[ ] Touch Target**: Is the interactive area at least 44x44px (or 24x24px minimum)?
    - Add `p-2` or `h-10 w-10` to icon buttons.
4.  **[ ] Semantics**: Are you using `<button>` for actions and `<a>` for links?

---

## 🚫 Common Mistakes to Avoid

| ❌ Bad (Hardcoded) | ✅ Good (Semantic) | Why? |
| :--- | :--- | :--- |
| `bg-white dark:bg-slate-900` | `bg-card` | Automatic theme switching. |
| `text-gray-900 dark:text-gray-100` | `text-foreground` | Consistent readability. |
| `border-gray-200` | `border-border` | Matches theme border opacity. |
| `bg-blue-600` (for primary action) | `bg-primary` | Allows global brand color changes. |
| `text-red-500` (for errors) | `text-destructive` | Accessible error red in both modes. |

---

**End of Guidelines**
