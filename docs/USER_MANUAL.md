# Sanchez Family OS - User Manual

## 👋 Welcome!
Welcome to the Sanchez Family Command Center (Beta). This app helps us coordinate our schedule, chores, and communication.

### 🔗 Getting Started
- **URL**: [sanchez-home.local](http://localhost:5173) (or the IP address provided by Dad)
- **Device Support**: Works on iPads, iPhones, and Laptops.

## 🔄 Sync & Troubleshooting
The app is designed to work **Offline**. Changes you make (adding tasks, messages) are saved to your device instantly and synced to everyone else when you are online.

**Offline Mode Capabilities**:
- ✅ **View Schedule & Chores**: All data is stored on your device.
- ✅ **Complete Tasks**: Mark chores as done; points update when you reconnect.
- ✅ **Write Messages**: Send messages; they will be delivered once you are back online.
- ❌ **Live Updates**: You won't see new messages or changes from others until connection is restored.

- **Syncing Indicator**: A spinning "SYNCING" icon in the top-right corner means data is being sent/received.
- **If you don't see an update**: Wait 5 seconds. If it still doesn't appear, refresh the page.
- **🚨 Emergency**: If the screen turns RED or you see a persistent error, **Text Dad**.

## 📱 Features Guide

### 🏠 Command Center
Your dashboard. Shows:
- **Today's Mission**: Your active chores. Complete them to earn points!
- **Financial Forecast**: Upcoming bills and due dates (Red alerts if due < 2 days).
- **Family Scoreboard**: See who leads the family in points!
- Weather and Up Next events.

### 📅 Smart Planner
The family calendar.
- **Blue events**: Appointments (Doctor, Sports)
- **Yellow events**: Reminders / Deadlines
- **$ Markers**: Upcoming bills (Hover to see amount and category).
- **To Add**: Click a day to add a new event.

### 💬 Family Messenger
Private family chat.
- Messages disappear after 24 hours.
- Images are supported (small size).
- **Notifications**: You will see a pop-up if a new message arrives while you are on another tab.

### 🥗 Wellness Engine
Track meals and workouts.
- **Nutrition**: Log meals, snacks, and water.
- **Sleep**: Track sleep duration and quality.
- **Mood**: Quick daily check-ins.

### 🧹 Chores & Organizer
The new Organizer module consolidates chores, finances, and shopping.
- **Chore Board**: View and complete your assigned chores. Focus cards to see details.
    - **Rotation**: Chores rotate automatically between assignees upon completion.
    - **Points**: Earn points for every chore completed.
- **Finance Tracker**: Track shared bills.
    - **Overdue Alerts**: Red text highlights bills that are past due.
- **Shopping List**: Shared grocery list.
    - **Scan Receipt**: Use the (simulated) camera to scan receipts.
    - **Live Sync**: Adds seen instantly by others.

### ♿ Accessibility Features
Your family OS is designed for everyone:
- **Keyboard Navigation**: Press `Tab` to move through all interactive elements.
- **Screen Reader Support**: All updates (like new messages or log items) are announced aloud.
- **High Contrast**: Colors are tuned for maximum readability (WCAG AA compliant).
- **Focus Rings**: Clear blue outlines show exactly which element is active.

### 🎨 Personalization
- **Theme Switching**: You can toggle between **Light**, **Dark**, and **System** themes.
    - Click the Sun/Moon icon in the sidebar (desktop) or top-right (mobile).
    - **Light Mode**: High brightness, good for day time.
    - **Dark Mode**: Low eye strain, good for night time.
    - **System**: Automatically follows your device's settings.

---
**Version**: 1.0.0-beta
**Support**: Dad/Sanchez Support Team

## 🛠️ Advanced: Local Sync Server
To ensure maximum speed and offline resilience within the home network:
1. Open a terminal in the project folder.
2. Run `npm run start:signaling`.
3. The app will prioritize connecting to this local server (port 4444) before trying public servers.
