# Product Requirements Document (SFOS)

## 1. Mission
Transform family life by minimizing chaos and enhancing well-being.
**Goal**: Single Source of Truth for logistics, memories, and plans.
**Key Features**: Real-time sync, Offline-First, Privacy-Focused (No Cloud/Ads).
**Mantra**: "Work-Free Zone" (No professional data).

## 2. Core Modules
- **Infinity Log (Family Brain)**: Tag-based database for receipts, milestones, emergency info, DIY tips. Fuzzy search; auto-reminders.
- **Command Center (Family Hub)**: Dashboard for at-a-glance views (plans, inventory, weather/outfits, mood check-ins, notifications).
- **Smart Planner (Scheduler)**: Collaborative calendar with draft/lock mode, goal tracking, vacation builder, conflict detection.
- **Wellness Engine (Health & Diet Optimizer)**: Meal planner (carnivore recipes, shopping lists), trackers (meals, exercise, sleep), suggestions.
- **Chore & Finance Manager (Organizer)**:
    - **Chores**: Task rotator (Daily/Weekly), Gamification (Stars/Points).
    - **Finance**: Bill tracker (Due Dates), Shared Shopping Lists, Document Scanner (Receipt integration).
- **Family Messenger**: Ephemeral messaging with images/GIFs; pop-ups on devices.

## 3. Technical Requirements
- **Stack**: React + Tailwind CSS.
- **Data Layer**: Yjs (CRDTs) + `y-indexeddb` (Local Persistence) + `y-partykit` (WebSocket Sync).
- **Authentication**: Zero Trust "Invite-Only" model. Admin generates invite codes; PartyKit rejects unauthorized connections.
- **Security**: Local-only data. No external analytics/trackers.
- **Performance**: <1s TTI. Retry budgets for network calls.
- **Devices**: 
    - **Kitchen Kiosk**: Wall-mounted, Landscape (1024x768+), High Contrast (Accessibility).
    - **Mobile**: Responsive, Touch-friendly.

## 4. Success Metrics
- **Reliability**: 95% sync success rate. Zero data loss offline.
- **Engagement**: Daily usage of Messenger and Planner.
- **Health**: 80% Carnivore diet adherence via Wellness Engine.

## 5. Roadmap
See [ROADMAP.md](./ROADMAP.md) for the detailed 11-Phase execution plan.
- **Current Status**: Executing **Phase 10** (Beta Iteration & UX Refinements).

### Remaining Phases
- **Phase 6**: Feature Implementation - Chore & Finance Manager. (Completed)
- **Phase 7**: Feature Implementation - Cross-Module Integrations & Polish.
- **Phase 8**: Advanced QA & Testing.
- **Phase 9**: Security & Privacy Audit.
- **Phase 10**: Beta Iteration & UX Refinements.
- **Phase 11**: Launch Prep & Monitoring.
