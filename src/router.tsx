import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { AdminGuard } from './components/layout/AdminGuard';

// Lazy-loaded module routes — each becomes its own chunk
const CommandCenter = lazy(() => import('./components/modules/CommandCenter').then(m => ({ default: m.CommandCenter })));
const SmartPlanner = lazy(() => import('./components/modules/SmartPlanner').then(m => ({ default: m.SmartPlanner })));
const WellnessEngine = lazy(() => import('./components/modules/WellnessEngine').then(m => ({ default: m.WellnessEngine })));
const FamilyMessenger = lazy(() => import('./components/modules/FamilyMessenger').then(m => ({ default: m.FamilyMessenger })));
const InfinityLog = lazy(() => import('./components/modules/InfinityLog').then(m => ({ default: m.InfinityLog })));
const OrganizerLayout = lazy(() => import('./components/modules/organizer/OrganizerLayout').then(m => ({ default: m.OrganizerLayout })));
const AdminDashboard = lazy(() => import('./components/modules/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const FinanceDashboard = lazy(() => import('./components/modules/finance/FinanceDashboard'));
const ProfilePage = lazy(() => import('./components/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {
                element: <AuthLayout />,
                children: [
                    {
                        element: <AppLayout />,
                        children: [
                            { index: true, element: <CommandCenter /> },
                            { path: 'planner', element: <SmartPlanner /> },
                            { path: 'wellness', element: <WellnessEngine /> },
                            { path: 'organizer', element: <OrganizerLayout /> },
                            { path: 'messenger', element: <FamilyMessenger /> },
                            { path: 'profile', element: <ProfilePage /> },
                            { path: 'profile/:userId', element: <ProfilePage /> },
                            { path: 'infinity-log', element: <InfinityLog /> },
                            {
                                path: 'finance',
                                element: <FinanceDashboard />,
                            },
                            {
                                path: 'admin',
                                element: (
                                    <AdminGuard>
                                        <AdminDashboard />
                                    </AdminGuard>
                                ),
                            },
                            { path: '*', element: <Navigate to="/" replace /> },
                        ],
                    },
                ],
            },
        ],
    },
]);
