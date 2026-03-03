import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProfileSelection } from '../auth/ProfileSelection';

export function AuthLayout() {
    const { isAuthenticated, user } = useAuth();

    // 1. Wait for AuthContext state to sync with the BackendAdapter
    // (The `protectedLoader` guarantees we are logged in, so if isAuthenticated is false
    //  or user is null, it just means the onAuthStateChange listener is still fetching data).
    // We must wait for the user object to fully hydrate before showing ProfileSelection.
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted-foreground animate-pulse font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    // 2. Authenticated but no profile -> Show Profile Selection/Setup
    if (!(user as any).partykit_id) {
        return <ProfileSelection />;
    }

    // 3. Authenticated & Profiled -> Render child routes
    return <Outlet />;
}
