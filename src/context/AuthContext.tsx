import React, { createContext, useContext, useState, useEffect } from 'react';

// Hardcoded for Phase 10a
const VALID_INVITE_CODE = "SANCHEZ-KIDS-2025";

interface User {
    id: string;
    name: string;
    role: 'admin' | 'parent' | 'kid';
    avatar?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    login: (code: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (profile: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Load state from localStorage on boot
        const storedToken = localStorage.getItem('sfos_token');
        const storedUser = localStorage.getItem('sfos_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (code: string) => {
        // Mock server validation (simulated delay)
        await new Promise(resolve => setTimeout(resolve, 500));

        if (code === VALID_INVITE_CODE) {
            const mockToken = `valid-token-${Date.now()}`;
            setToken(mockToken);
            setIsAuthenticated(true); // User is authenticated but might need profile setup
            localStorage.setItem('sfos_token', mockToken);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        localStorage.removeItem('sfos_token');
        localStorage.removeItem('sfos_user');
    };

    const updateProfile = (profile: Partial<User>) => {
        const newUser = { ...user, ...profile } as User;
        setUser(newUser);
        localStorage.setItem('sfos_user', JSON.stringify(newUser));
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
