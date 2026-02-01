# Sanchez Family OS (SFOS)

![Version](https://img.shields.io/badge/version-1.0.0--beta-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![Compliance](https://img.shields.io/badge/WCAG_2.2-Level_AA-green.svg)

A local-first, offline-capable Progressive Web App (PWA) designed to reduce household chaos. Built with React, Tailwind CSS, and Yjs.

## 🚀 Features

- **Command Center**: Central dashboard for family vitals.
- **Smart Planner**: Shared calendar for appointments and reminders.
- **Family Messenger**: Private, local-first messaging.
- **Wellness Engine**: Track meals, workouts, and sleep.
- **Organizer**:
    - **Chore Board**: Gamified points system for chores.
    - **Finance Tracker**: Bill tracking with overdue alerts.
    - **Shopping List**: Shared list with "scan" functionality.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS v4, Class Variance Authority (CVA)
- **State/Sync**: Yjs (CRDTs), y-webrtc, y-indexeddb
- **Testing**: Vitest, React Testing Library, ax-core

## 🏃‍♂️ Running Locally

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    npm run dev
    ```
3.  **Run tests**:
    ```bash
    npm test
    ```

## ♿ Accessibility

This project adheres to **WCAG 2.2 Level AA** standards.
- High contrast color themes (Light/Dark mode).
- Full keyboard navigation support.
- Screen reader optimized (ARIA labels, semantic HTML).

## 📄 Documentation

- [User Manual](./docs/USER_MANUAL.md)
- [Project Roadmap](./ROADMAP.md)
