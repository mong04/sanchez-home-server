# Sanchez Family OS — UI/UX Design Guide

**For:** Developers, Designers, and AI Agents building features for SFOS  
**Stack:** React + TypeScript, Tailwind CSS v4, Vite  
**Last updated:** February 2026

---

## Table of Contents

1. [Design Philosophy](#-design-philosophy)
2. [Semantic Token System](#-semantic-token-system)
3. [Responsive Breakpoints](#-responsive-breakpoints)
4. [Component Library](#-component-library)
5. [Layout Patterns](#-layout-patterns)
6. [Card Design](#-card-design)
7. [Typography & Spacing](#-typography--spacing)
8. [Animation & Micro-interactions](#-animation--micro-interactions)
9. [Data Visualization](#-data-visualization)
10. [Empty States](#-empty-states)
11. [Accessibility Requirements](#-accessibility-requirements)
12. [Agent Skills Reference](#-agent-skills-reference)
13. [Anti-patterns](#-anti-patterns)

---

## 🎨 Design Philosophy

SFOS is a **family-first home management app** designed to feel premium, alive, and approachable. Every design choice must serve clarity, engagement, and habit-forming behavior.

### Core Principles

1. **Semantic over hardcoded** — Use semantic tokens (`bg-card`, `text-foreground`) instead of color values. This ensures automatic light/dark mode support.
2. **Responsive-first** — Every component must look great on iPhone SE through ultrawide monitors. Design mobile-first, then enhance.
3. **Alive, not static** — Subtle animations, hover effects, and micro-interactions make the UI feel responsive and engaging.
4. **Premium, not minimal** — Use gradients, shadows, and visual hierarchy to create depth. Avoid flat, skeleton-like layouts.
5. **Consistent, not clever** — Follow established patterns. A new component should look like it belongs.

---

## 🛠️ Semantic Token System

All colors are defined in `src/index.css` as HSL CSS variables with automatic light/dark mode switching. **Never use raw Tailwind colors** for structural elements.

### Quick Reference

| Purpose | Tailwind Class | When to Use |
|---------|---------------|-------------|
| Page background | `bg-background` | Root-level page wrapper |
| Card / container | `bg-card` | Cards, modals, sheets |
| Primary text | `text-foreground` | Headings, body text |
| Secondary text | `text-muted-foreground` | Hints, labels, timestamps |
| Primary action | `bg-primary` / `text-primary` | Buttons, active indicators |
| Borders | `border-border` | Card borders, dividers |
| Hover highlight | `bg-accent` | Dropdown items, list hover |
| Subtle background | `bg-muted` | Table headers, chips, tags |
| Error / danger | `text-destructive` / `bg-destructive` | Delete actions, error states |
| Success | `text-success` / `bg-success` | Confirmations, completion |
| Warning | `text-warning` / `bg-warning` | Alerts, due-soon states |
| Info | `text-info` / `bg-info` | Informational callouts |
| Focus ring | `ring-ring` | Focus indicators (required!) |

### Accent Colors (Categorical)

For dashboard cards and feature-specific accents, use **Tailwind's named colors** with opacity modifiers:

```
Chores/Tasks   → emerald-500   (bg-emerald-500/10, text-emerald-500)
Finance/Bills  → rose-500      (bg-rose-500/10, text-rose-500)
Calendar       → sky-500       (bg-sky-500/10, text-sky-500)
Gamification   → amber-500     (bg-amber-500/10, text-amber-500)
Messaging      → primary       (bg-primary/10, text-primary)
```

> [!IMPORTANT]
> Named Tailwind colors (emerald, rose, sky, amber) are acceptable for **categorical accents only**. All structural backgrounds, text, and borders must use semantic tokens.

---

## 📱 Responsive Breakpoints

SFOS uses Tailwind's default breakpoints. Design **mobile-first**, then enhance:

| Breakpoint | Width | Device Targets | Design Focus |
|-----------|-------|---------------|-------------|
| Default (no prefix) | `<640px` | iPhone SE, iPhone 14, small Android | Single column, compact padding, touch-optimized |
| `sm:` | `≥640px` | Large phones (landscape), small tablets | Slightly wider spacing |
| `md:` | `≥768px` | iPad Mini, iPad, tablets | 2-column grids, expanded content |
| `lg:` | `≥1024px` | iPad Pro (landscape), small laptops | 3-column grids, sidebar layouts |
| `xl:` | `≥1280px` | Desktop, laptop | Full layouts, maximum content density |

### Responsive Rules

1. **Padding scales up**: `p-4` → `md:p-6` → `lg:p-8`
2. **Text scales up**: `text-sm` → `md:text-base`, `text-2xl` → `md:text-3xl`
3. **Grid columns expand**: `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3`
4. **Show/hide elements**: Use `hidden md:block` for desktop-only content (e.g., summary chips)
5. **Touch targets**: Minimum `44×44px` on mobile (`w-12 h-12` or `p-3` on icon buttons)

### Responsive Text Pattern

For labels that need to adapt by screen size:

```tsx
{/* Single letter on mobile, full word on tablet+ */}
<span className="text-[8px] sm:hidden">S</span>
<span className="hidden sm:inline text-[10px]">Sun</span>
```

---

## 🧱 Component Library

### Existing Common Components (`src/components/common/`)

| Component | File | Usage |
|-----------|------|-------|
| `Button` | `Button.tsx` | Primary CTA, variants: `default`, `outline`, `ghost`, `destructive` |
| `Card` | `Card.tsx` | Container with `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` |
| `Modal` | `Modal.tsx` | Overlay dialogs |
| `Input` | `Input.tsx` | Form inputs |
| `Badge` | `Badge.tsx` | Status labels, tags |
| `Loading` | `Loading.tsx` | Loading spinners |
| `TagInput` | `TagInput.tsx` | Multi-tag input fields |
| `ThemeToggle` | `ThemeToggle.tsx` | Light/dark mode switch |
| `FeedbackModal` | `FeedbackModal.tsx` | User feedback collection |

### Building New Components

```tsx
import * as React from "react"
import { cn } from "../../lib/utils"

interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight"
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base structure
        "rounded-2xl border p-4 shadow-sm transition-all",
        // Semantic colors
        "bg-card text-card-foreground border-border",
        // Focus (REQUIRED for interactive elements)
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Variant
        variant === "highlight" && "border-primary/50 bg-primary/5",
        // Custom overrides
        className
      )}
      {...props}
    />
  )
)
MyComponent.displayName = "MyComponent"
```

> [!TIP]
> Always use `rounded-2xl` for cards and `rounded-xl` for inner elements (list items, chips). This creates a consistent visual hierarchy.

---

## 📐 Layout Patterns

### Dashboard Grid (Primary + Secondary)

The Dashboard uses a two-tier grid structure:

```tsx
{/* Primary: 2 columns on tablet+ */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
  {/* High-priority cards */}
</div>

{/* Secondary: 3 columns on desktop */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
  <div className="lg:col-span-2">{/* Wide component */}</div>
  <div className="space-y-4">{/* Stacked smaller components */}</div>
</div>
```

### Page Header Pattern

```tsx
<header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-card to-card border border-border p-5 md:p-8">
  <div className="relative z-10">
    <p className="text-sm text-muted-foreground font-medium mb-1">{subtitle}</p>
    <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
  </div>
  {/* Optional decorative blob */}
  <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
</header>
```

### Profile Two-Column Layout

```tsx
<div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
  <div className="space-y-6">{/* Main content */}</div>
  <div className="space-y-6">{/* Sidebar */}</div>
</div>
```

---

## 🃏 Card Design

### Standard Clickable Card

```tsx
<Card
  className="group border-l-4 border-l-emerald-500 cursor-pointer
             hover:shadow-lg hover:-translate-y-0.5 transition-all"
  onClick={handleClick}
>
  <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
    <CardTitle className="text-base md:text-lg flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-emerald-500/10">
        <Icon className="w-4 h-4 text-emerald-500" />
      </div>
      <span>Card Title</span>
    </CardTitle>
    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 
                           group-hover:opacity-100 transition-all" />
  </CardHeader>
  <CardContent>{/* ... */}</CardContent>
</Card>
```

**Key patterns:**
- **`border-l-4`** with a category color for visual identification
- **`group` + `group-hover:`** for coordinated hover effects
- **Arrow indicator** that appears on hover (`opacity-0 group-hover:opacity-100`)
- **`hover:-translate-y-0.5`** for subtle lift animation

### Stat Cards

```tsx
<div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
  <span className="text-2xl">🔥</span>
  <div>
    <div className="text-2xl font-bold text-foreground">42</div>
    <div className="text-xs text-muted-foreground">Day Streak</div>
  </div>
</div>
```

### List Items Inside Cards

```tsx
<div className="flex items-center justify-between p-2.5 md:p-3 
                bg-accent/30 rounded-xl border border-border/50 
                hover:bg-accent/50 transition-colors">
  <div className="min-w-0">
    <div className="font-medium text-foreground text-sm truncate">{title}</div>
    <div className="text-xs text-muted-foreground">{subtitle}</div>
  </div>
  <div className="shrink-0 ml-2">{/* Action or badge */}</div>
</div>
```

---

## 🔤 Typography & Spacing

### Type Scale

| Role | Classes | Example |
|------|---------|---------|
| Page title | `text-2xl md:text-3xl font-bold` | "Good Morning, Brandon" |
| Card title | `text-base md:text-lg font-semibold` | "Today's Mission" |
| Body text | `text-sm text-foreground` | List item labels |
| Hint/label | `text-xs text-muted-foreground` | Timestamps, point values |
| Stat number | `text-2xl md:text-3xl font-bold` | "72°", "42 pts" |
| Tiny label | `text-[8px] sm:text-[10px]` | Heatmap labels, axis labels |

### Spacing Rhythm

- **Section gaps**: `space-y-6` (24px)
- **Card internal padding**: `p-4 md:p-6` (16px → 24px)
- **List item gaps**: `space-y-2` (8px)
- **Inner element gaps**: `gap-2` or `gap-3`
- **Grid gaps**: `gap-4 md:gap-6`

---

## ✨ Animation & Micro-interactions

### Entry Animations

Use staggered slide-in for page load:

```tsx
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  {/* Content */}
</div>

{/* Stagger children with delay */}
<Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
<Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
<Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
```

### Hover Effects

```
Cards:         hover:shadow-lg hover:-translate-y-0.5 transition-all
List items:    hover:bg-accent/50 transition-colors
Buttons:       active:scale-95 transition-transform
Icon buttons:  group-hover:scale-110 transition-transform duration-300
Reveal arrows: opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5
```

### Interactive Buttons (Mood check-in style)

```tsx
<button className="group focus-visible:outline-none focus-visible:ring-2 
                   focus-visible:ring-ring rounded-xl p-2 
                   transition-transform active:scale-95">
  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-muted border border-border 
                  flex items-center justify-center 
                  group-hover:bg-emerald-500/10 group-hover:border-emerald-500/50 
                  transition-all shadow-sm">
    <Icon className="w-6 h-6 text-muted-foreground group-hover:text-emerald-500" />
  </div>
</button>
```

---

## 📊 Data Visualization

### Activity Heatmap (GitHub-style)

The heatmap uses fixed-size cells for reliable alignment:

| Property | Mobile | Tablet+ |
|----------|--------|---------|
| Cell size | `w-[10px] h-[10px]` | `sm:w-3 sm:h-3` (12px) |
| Gap | `mb-[3px]` / `mr-[3px]` | `sm:mb-1` / `sm:mr-1` |
| Day labels | Single letter (`S`) | Three-letter (`Sun`) |
| Weeks shown | 13 weeks (3 months) | 26 (tablet) / 52 (desktop) |
| Month boundary | Extra `ml-[3px] sm:ml-1.5` gap | Same spacing both sides |
| Bleed cells | `opacity-40` | Previous month's cells in boundary weeks |

**Key rules:**
- **Never use `aspect-square` with `flex-1`** — different column widths produce different heights
- **Use fixed dimensions** (`w-[10px] h-[10px]`) for grid cells
- **Day labels must match cell height exactly** for row alignment
- **Month labels**: One per week column, placed at the first week containing that month
- **Always end at today** — truncate from the start (oldest weeks), not the end

### Responsive Week Count

```tsx
const [weekCount, setWeekCount] = useState(52);
useEffect(() => {
  const update = () => {
    const w = window.innerWidth;
    setWeekCount(w < 640 ? 13 : w < 1280 ? 26 : 52);
  };
  update();
  window.addEventListener('resize', update);
  return () => window.removeEventListener('resize', update);
}, []);
```

---

## 🫙 Empty States

Every list/grid that can be empty needs a styled empty state:

```tsx
{items.length === 0 ? (
  <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
    <div className="p-2.5 rounded-full bg-emerald-500/10 mb-2">
      <Icon className="w-5 h-5 text-emerald-500" />
    </div>
    <span className="font-medium">All clear!</span>
    <span className="text-xs mt-0.5">Helpful subtext here</span>
  </div>
) : (
  /* Populated state */
)}
```

**Rules:**
- Always include an icon in a tinted circle
- Two-line message: **bold primary**, light secondary
- Use the card's accent color for the icon background
- No placeholders or "lorem ipsum"

---

## ♿ Accessibility Requirements

Every interactive element **must** pass these checks:

| Check | Implementation | Required? |
|-------|---------------|-----------|
| Focus ring | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | ✅ Required |
| Color contrast | Use `text-foreground` on `bg-card` / `bg-background` | ✅ Required |
| Touch target | Minimum `44×44px` (use `p-3` or `w-12 h-12`) | ✅ Required on mobile |
| Semantic HTML | `<button>` for actions, `<a>` for navigation | ✅ Required |
| Hover + focus parity | Hover styles should also work on `:focus-visible` | ✅ Required |

---

## 🤖 Agent Skills Reference

The `.agent/skills/` directory contains specialized instruction files for AI agents. **Read the relevant SKILL.md before starting design work.**

### Design-Critical Skills

| Skill | Path | When to Use |
|-------|------|-------------|
| **Tailwind Design System** | `.agent/skills/tailwind-design-system` | Understanding token architecture and Tailwind v4 patterns |
| **Tailwind CSS v4** | `.agent/skills/tailwindcss-v4` | v4-specific syntax (`@theme`, `@layer base`, new class patterns) |
| **Web Design Guidelines** | `.agent/skills/web-design-guidelines` | General web UI best practices, layout patterns |
| **Baseline UI** | `.agent/skills/baseline-ui` | Component baseline standards |
| **Fixing Accessibility** | `.agent/skills/fixing-accessibility` | WCAG compliance, screen reader support |
| **Fixing Motion Performance** | `.agent/skills/fixing-motion-performance` | Animation jank, `will-change`, GPU layers |
| **React Specialist** | `.agent/skills/react-specialist` | React patterns, hooks, component architecture |

### Platform-Specific Skills

| Skill | Path | When to Use |
|-------|------|-------------|
| **iPadOS Design Guidelines** | `.agent/skills/ipados-design-guidelines` | Tablet-specific UI concerns |
| **Android Design Guidelines** | `.agent/skills/android-design-guidelines` | Android PWA considerations |
| **Screenshots** | `.agent/skills/screenshots` | Taking and using screenshots for verification |

---

## 🚫 Anti-patterns

### Never Do This

| ❌ Bad | ✅ Good | Why |
|--------|---------|-----|
| `bg-white dark:bg-slate-900` | `bg-card` | Hardcoded colors break theming |
| `text-gray-500` | `text-muted-foreground` | Inconsistent across themes |
| `aspect-square` + `flex-1` in grids | Fixed `w-[10px] h-[10px]` cells | Different widths = different heights |
| `gap-[3px]` for both labels and cells | Same `mb-[3px]` on each element | Gap doesn't apply to the container's children uniformly with mixed sizes |
| Empty `<div>` for empty states | Styled empty state with icon + message | Users need to know the section works |
| `onClick` on `<div>` without `role` | `<button>` or `<Card>` with keyboard support | Breaks keyboard/screen reader navigation |
| `animate-bounce` on everything | Staggered `animate-in fade-in` on page load | Excessive animation is distracting |
| `min-w-[600px]` wrapper for responsiveness | Responsive week count + fixed cells | Scrolling should be a last resort |
| Percentage-based grid cell widths | Fixed dimensions with overflow-x-auto | Percentage causes jitter across viewports |

---

**End of Guide** — When in doubt, look at `CommandCenter.tsx` (Dashboard) and `ProfilePage.tsx` (Profile) as reference implementations.
