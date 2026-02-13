# Setup Instructions

## Prerequisites
- Node.js (Latest LTS recommended)

## Installation

```bash
npm install
```

## Running Development Server

```bash
npm run dev
```

## Running Tests

```bash
npm test
```

## Building for Production

```bash
npm run build
```

## Client-Side Routing

The app uses **react-router-dom** for client-side routing. Each module has its own URL path:

| Path | Module |
|------|--------|
| `/` | Command Center (Home) |
| `/planner` | Smart Planner |
| `/wellness` | Wellness Engine |
| `/organizer` | Organizer (Chores/Finance/Shopping) |
| `/messenger` | Family Messenger |
| `/profile` | Profile Page |
| `/profile/:userId` | View another family member's profile |
| `/admin` | Admin Dashboard (role-guarded) |
| `/infinity-log` | Infinity Log |

### Key behaviors:
- **Deep links are supported**: You can directly navigate to any URL (e.g., `localhost:5173/planner`) and land on the correct module after authentication.
- **Browser navigation works**: Back, Forward, and Refresh buttons function as expected.
- **Refresh preserves state**: Pressing F5 on `/planner` will reload the Planner, not the homepage.
- **Unknown routes redirect**: Any unrecognized URL path redirects to `/` (Command Center).
