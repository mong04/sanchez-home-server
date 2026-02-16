import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProfileSelection } from '../auth/ProfileSelection';

export function AuthLayout() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    // 1. Runtime Guard: Redirect to login if auth state creates (e.g. logout)
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // 2. Authenticated but no profile -> Show Profile Selection/Setup
    if (isAuthenticated && !user) {
        return <ProfileSelection />;
    }

    // 3. Authenticated & Profiled -> Render child routes
    return <Outlet />;
}
