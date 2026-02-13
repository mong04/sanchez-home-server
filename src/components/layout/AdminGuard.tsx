import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminGuardProps {
    children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
    const { user } = useAuth();

    // Allow Admins AND Parents to access the Admin Dashboard
    if (user?.role !== 'admin' && user?.role !== 'parent') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
