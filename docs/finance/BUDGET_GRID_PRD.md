## Budget Grid (The Heart of the App)

**Vision**  
The Budget Grid is the single most important screen in the entire app. It must feel **calm, premium, clean, and motivating** — like YNAB and Monarch had a beautiful, modern baby built specifically for couples who want to work on their money *together*.

When you (or your wife) open the Budget tab, you should immediately feel:
- Calm and in control
- Motivated to assign every dollar with intention
- Proud of progress (especially rollover and To Be Budgeted)
- Excited to do this together with your partner

**Core Philosophy**  
True zero-based budgeting with positive rollover only. Every new month starts fresh ($0 budgeted) to force intentional decisions. Overspending is not punished — it’s an opportunity to “roll with the punches” intelligently.

**User Flow & States**

**1. First Visit to a New Month (Only Once Per Month)**  
- Automatically open NewMonthModal on first load of a new month with zero allocations.  
- Modal must feel helpful and welcoming, never like an obstacle.  
- Large, beautiful “Available to Assign” number (Income + Rollover).  
- Three clear, emotionally distinct choices:  
  - **Primary green button**: “Start Fresh — Assign Every Dollar” (recommended)  
  - **Secondary**: “Copy [Previous Month]’s Budget”  
  - **Secondary**: “Use 3-Month Average”  
- Add subtle fourth option at bottom: “Start a Money Date” (if both partners are online).

**2. Normal View (The Grid)**  
- **Hero “To Be Budgeted” card** at the very top:  
  - Large, prominent number (biggest text on screen).  
  - Green when positive, soft rose when negative.  
  - Smooth scale + color animation when the number changes.  
  - Click anywhere on the hero to edit Income inline with a smooth input transition.  
  - When it hits exactly $0, trigger a subtle confetti celebration (canvas-confetti, gentle and classy).

- **Live Collaboration Indicator**  
  - Small, tasteful badge near the top right of the hero: “Partner is viewing live” with a pulsing green dot.  
  - Only appears when peerCount > 1.  
  - Optional: show a subtle “Partner is editing [Category Name]” toast when the other person starts typing.

- **The Grid Itself**  
  - Clean, minimalist table with excellent spacing.  
  - Columns: Category | Budgeted (editable) | Spent | Available  
  - Available column: bold, green when positive, rose when negative.  
  - Hover on any row shows small inline actions: edit category, delete category.  
  - Full category management directly in the grid (add new category button at bottom, inline edit name/color, delete with confirmation).  
  - Smooth Framer Motion: every budgeted change animates the Available number and row background.  
  - Overspent rows get a very soft rose background + a small “Fix this” suggestion button that proposes low-pain swaps from other categories.

- **Footer Totals Row**  
  - Always visible.  
  - Shows Total Budgeted | Total Spent | Total Available (with color).

**3. Mobile Experience**  
- Must feel like a premium native app.  
- On small screens: collapse to a card list instead of table.  
- Large touch targets, easy numpad from FAB, excellent keyboard avoidance.

**Delight & Emotional Details**
- Every number change feels alive and responsive.
- When To Be Budgeted reaches exactly $0 → gentle confetti + soft “All money assigned” message.
- Empty state (no categories): warm, encouraging illustration + big “Let’s add some categories” button.
- All interactions have micro-animations and haptic feedback on mobile.

**Data & State**
- Budgeted values live in Yjs (real-time sync).
- Spent values calculated from real transactions in PocketBase.
- Income and rollover live in PocketBase (budget_months record).
- All changes to allocations auto-save to PocketBase with 800ms debounce.