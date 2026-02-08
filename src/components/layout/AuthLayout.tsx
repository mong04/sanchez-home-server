import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { InviteScreen } from '../auth/InviteScreen';
import { ProfileSelection } from '../auth/ProfileSelection';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    const { isAuthenticated, user } = useAuth();

    // 1. Not Authenticated -> Show Airlock (Invite Screen)
    if (!isAuthenticated) {
        return <InviteScreen />;
    }

    // 2. Authenticated but no profile -> Show Profile Selection/Setup
    if (isAuthenticated && !user) {
        return <ProfileSelection />;
    }

    // 3. Authenticated & Profiled -> Show App (Children)
    return <>{children}</>;
}
