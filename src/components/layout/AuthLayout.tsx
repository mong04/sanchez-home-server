import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProfileSelection } from '../auth/ProfileSelection';

export function AuthLayout() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // 1. Runtime Guard: Redirect to login if auth state clears (e.g. logout)
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return null;
    }

    // 2. Authenticated but no profile -> Show Profile Selection/Setup
    if (!user || !(user as any).partykit_id) {
        return <ProfileSelection />;
    }

    // 3. Authenticated & Profiled -> Render child routes
    return <Outlet />;
}
