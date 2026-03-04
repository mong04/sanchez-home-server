import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProfileSelection } from '../auth/ProfileSelection';

export function AuthLayout() {
    const { isLoading, isAuthenticated, user } = useAuth();

    // 1. Initial hydration check
    if (isLoading || (isAuthenticated && !user)) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    // 2. Unauthenticated -> Kick to login
    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Authenticated but no profile -> Show Profile Selection/Setup
    if (user && !(user as any).partykit_id) {
        return <ProfileSelection />;
    }

    // 3. Authenticated & Profiled -> Render child routes
    return <Outlet />;
}
