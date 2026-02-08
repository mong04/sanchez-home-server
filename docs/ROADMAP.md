# Sanchez Family OS (SFOS) - Project Roadmap

## ✅ Completed Phases (Foundation to MVP)
- [x] **Phase 1: Foundation** (Setup, Yjs Init, Test Data)
- [x] **Phase 2: Data Layer** (Infinity Log, Basic Store Logic)
- [x] **Phase 3: UI & Core Modules** (Command Center, Planner, Wellness UI)
- [x] **Phase 4: Advanced Features** (Family Messenger, E2E Tests, Notifications)
- [x] **Phase 5: Polish & Testing** (User Manual, Loading States, Build Verification)

## 🚧 Feature Implementation Phases (Current Focus)
**Goal**: Achieve full feature parity with PRD before major QA.

- **Phase 6: Feature Implementation - Chore & Finance Manager**
    - [x] UI: Tabbed interface for Tasks vs Bills.
    - [x] Features: Task Rotation logic, Shared Shopping Lists.
    - [x] Doc Scanner: Camera capture for receipts (OCR placeholder).
    - [x] Sync: Ensure lists update across peers.
    - Description: Fully build out UI (task rotator, bill trackers, shopping lists, document scanner with OCR), logic (reminders, gamification), and integrations (e.g., link to Command Center/Planner). Ensure sync for shared lists.
- **Phase 7: Feature Implementation - Cross-Module Integrations & Polish**
    - [x] Cross-Module: Tie all modules together (e.g., chores in Planner, finances in Wellness).
    - [x] Gamification: Points display in Command Center.
    - [x] Consistency: Standardize UI components (Buttons, Cards).
    - [x] Address PRD gaps (e.g., user roles, custom recipes).

## 🚀 Launch Readiness Phases
**Goal**: Professional validation for family deployment.

- **Phase 8: Advanced QA & Testing**
    - [x] Full automated/manual tests, cross-device verification, performance benchmarks.
    - [x] Create Tester Agent if needed.

- **Phase 8b: E2E Verification & Resilience (Auditor Remediation)**
    - [x] **Tooling**: Install Playwright & Config.
    - [x] **Test Suite**: Multi-device sync scenarios (Phone <-> Tablet).
    - [x] **Infrastructure**: Local Signaling Server for offline resilience.
    - [x] **Validation**: Verify sync works without WAN.

- **Phase 8c: Infrastructure & UI Overhaul**
    - [x] **Sync Architecture**: Migrated to PartyKit (WebSocket) for improved reliability.
    - [x] **UI/UX**: Full Theming (Dark/Light) and WCAG 2.2 AA Compliance.
    - [x] **Project Structure**: Updated component library with semantic tokens.

- **Phase 9: Security & Privacy Audit**
    - [x] Vulnerability scans, privacy reviews, backup testing.
    - [x] Create Auditor Agent.

- **Phase 10a: Secure Family Foundation (Authentication)**
    - [ ] **Data Layer**: Implement `onConnect` token validation in PartyKit.
    - [ ] **Admin**: "Invite Code" generation strategy (Environment Variables).
    - [ ] **UI**: "Airlock" screen (Invite Code entry).
    - [ ] **Onboarding**: "Create Profile" screen (Name, Avatar, Role) immediately after unlock.

- **Phase 10b: Deep Feature Iteration (Gamification & Profiles)**
    - [ ] **User Profiles**: Yjs User Store (Avatar, Name, Role).
    - [ ] **Gamification**: XP System, Streaks, Leaderboards.
    - [ ] **Family Beta**: Feedback integration, A/B variants.

- **Phase 11: Launch Prep & Monitoring**
    - [ ] Staged deployment, onboarding docs, monitoring setup, release notes.
    - [ ] Final Go for launch.

## 🛠 Recommended Agent Skills
To accelerate the remaining phases, I have identified the following high-value skills from the [Awesome Agent Skills](https://github.com/VoltAgent/awesome-agent-skills) repository:

### For Phase 9 (Security Audit)
- **`trailofbits/static-analysis`**: Deployment of CodeQL and Semgrep for deep vulnerability scanning.
- **`trailofbits/insecure-defaults`**: Detection of hardcoded secrets or weak configurations.
- **`trailofbits/ask-questions-if-underspecified`**: Ensures requirements are clear before auditing.

### For Phase 10 (Beta & UX)
- **`anthropics/webapp-testing`**: Automation of Playwright scenarios for regression testing.
- **`shpigford/screenshots`**: Generating consistent viewport screenshots for documentation and visual verification.
- **`ehmo/platform-design-skills`**: verification of Accessibility/Touch targets against Apple/Material guidelines for PWA.

### For Phase 10a (Secure Auth)
- **`clerk/clerk-sdk`** (Reference): *Note: We are building custom local auth, but Clerk patterns are good references.*
- **`auth0/jwt-best-practices`**: Guidelines for secure token handling.

### General Engineering
- **`vercel-labs/react-best-practices`**: Enforcing consistent patterns during refactors.
- **`composiohq/changelog-generator`**: Automating the release notes for Phase 11.
