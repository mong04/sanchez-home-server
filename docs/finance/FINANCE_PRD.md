# FINANCE_PRD.md — Sanchez Family OS Finance Module
**Version:** 1.0 (February 2026)  
**Owner:** The Family (you + wife)  
**Goal:** Build the single most delightful, habit-forming, and relationship-strengthening finance tool a couple has ever used — one that actually transforms our financial health and makes us excited to open the app every day.

## Overall Vision
This is not “just another budgeting app.”  
It is a private, shared family command center that feels calm, premium, clean, and motivating.  
It combines:
- YNAB’s intentional zero-based philosophy (“every dollar gets a job”)
- Monarch’s beautiful visuals and sinking funds
- Honeydue’s couple-first transparency and shared responsibility
- Our unique superpower: **real-time collaborative editing** (Google Docs level) so we can budget together on Sunday nights without fighting over who has the latest version.

The entire module must feel like a premium native app — buttery animations, thoughtful micro-interactions, emotional feedback, and zero friction.

## Phase 2 – Budget Engine (The Heart of the App)
This phase is where the magic happens. The Budget Grid must feel alive, shared, and motivating.

### Budget Grid Screen
**Emotional Goal**  
When we open the Budget tab, we should immediately feel calm, in control, and motivated. It should feel like a safe, beautiful space where we work *together* on our future.

**Hero “To Be Budgeted” Card** (top of screen)
- Largest, most prominent number on the entire screen.
- Green when positive, soft rose when negative.
- Smooth scale + color animation whenever the number changes.
- Click anywhere on the card to edit Income inline (smooth input transition).
- When it hits exactly $0 → gentle, classy confetti celebration (canvas-confetti, not over-the-top).

**Live Collaboration Indicator**
- Small, tasteful badge near the top right of the hero: “Partner is viewing live” with a pulsing green dot.
- Only appears when peerCount > 1.
- Optional subtle toast when the other person starts editing a category.

**The Grid**
- Clean, minimalist, premium table with excellent spacing.
- Columns: Category | Budgeted (editable input) | Spent | Available
- Available column is bold and changes color instantly (green/red).
- Hover on any row reveals inline actions: edit category, delete category.
- Full category management directly in the grid (no need to leave the screen).
- Every budgeted change triggers a smooth Framer Motion animation on the Available number and row background.
- Overspent rows get a very soft rose background + a small “Fix this” button that suggests low-pain money moves from other categories.

**Footer Totals Row**
- Always visible at the bottom.
- Shows Total Budgeted | Total Spent | Total Available (with color).

**Mobile Experience**
- On small screens, gracefully collapse to a beautiful card list instead of a table.
- Large touch targets, excellent keyboard avoidance, feels like a premium native app.

**Empty State**
- Warm, encouraging illustration + big “Let’s add some categories” button.

### NewMonthModal (only on first visit to a new month)
- Beautiful centered modal with warm welcome message.
- Large “Available to Assign” number (Income + Rollover) with clear breakdown.
- Three prominent choices:
  - Primary green button: “Start Fresh — Assign Every Dollar” (recommended)
  - Secondary: “Copy [Previous Month]’s Budget”
  - Secondary: “Use 3-Month Average”
- Subtle fourth option at bottom: “Start a Money Date” (if both partners are online).

### TransactionFab (Quick Add)
- Fixed bottom-right floating + button. (should not overlap navigation bar)
- 3-step delightful flow:
  1. Beautiful numpad (live display, haptic feedback on every keypress).
  2. Select category (expense only).
  3. Select account.
- Smooth Framer Motion sliding transitions between steps.
- After save → brief “Saved!” success toast.

**General Delight Rules for Phase 2**
- Every number change must feel alive and responsive.
- Use Framer Motion liberally but tastefully.
- Haptic feedback on mobile for all button presses and keypresses.
- When To Be Budgeted hits exactly $0 → subtle celebration.
- All interactions must feel premium and calming.

**Data Flow**
- Budgeted values live in Yjs (real-time sync).
- Spent values calculated from real transactions in PocketBase.
- Income and rollover stored in budget_months record.
- All allocation changes auto-save to PocketBase with 800ms debounce.

**Success Criteria for Phase 2**
- My wife and I can both be editing the same budget at the same time without conflicts and it feels magical.
- The first time we open a new month feels helpful and exciting, not overwhelming.
- We actually look forward to opening the Budget tab together on Sunday nights.
- The experience feels noticeably better and more modern than YNAB or Monarch.

---

**You now have the full FINANCE_PRD.md ready.**

Next step:  
Paste the **Phase 2 prompt** I gave you earlier into Antigravity/Gemini, but add this line at the top:
