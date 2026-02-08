import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '../config/env';

// API Configuration
const PARTYKIT_HOST = env.PARTYKIT_HOST;
const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

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
    profiles: User[];
    login: (code: string) => Promise<boolean>;
    logout: () => void;
    selectProfile: (profileId: string) => Promise<void>;
    createProfile: (profile: Omit<User, 'id'>) => Promise<void>;
    fetchProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [profiles, setProfiles] = useState<User[]>([]);

    useEffect(() => {
        // Load state from localStorage on boot
        const storedToken = localStorage.getItem('sfos_token');
        const storedUser = localStorage.getItem('sfos_user');

        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
            // Fetch profiles if we have a token (even a family one)
            fetchProfiles(storedToken);
        }
    }, []);

    const apiRequest = async (endpoint: string, method: string, body?: any, currentToken?: string | null) => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        const authToken = currentToken || token;
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }
        return response.json();
    };

    const fetchProfiles = async (currentToken?: string) => {
        try {
            const data = await apiRequest('/family/profiles', 'GET', undefined, currentToken);
            setProfiles(data);
        } catch (error) {
            console.error("Failed to fetch profiles:", error);
            // If fetching profiles fails with 401, we might be expired
        }
    };

    const login = async (code: string) => {
        try {
            const data = await apiRequest('/auth/login', 'POST', { code });
            const newToken = data.token;

            setToken(newToken);
            setIsAuthenticated(true);
            localStorage.setItem('sfos_token', newToken);

            // Immediately fetch profiles with the new token
            await fetchProfiles(newToken);
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const selectProfile = async (profileId: string) => {
        try {
            const data = await apiRequest('/auth/session', 'POST', { profileId });
            handleUserSession(data.token, data.user);
        } catch (error) {
            console.error("Failed to select profile:", error);
        }
    };

    const createProfile = async (profileData: Omit<User, 'id'>) => {
        try {
            const newProfile = { ...profileData, id: crypto.randomUUID() };
            const data = await apiRequest('/family/profiles', 'POST', newProfile);
            handleUserSession(data.token, data.user);
        } catch (error) {
            console.error("Failed to create profile:", error);
        }
    };

    const handleUserSession = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('sfos_token', newToken);
        localStorage.setItem('sfos_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setProfiles([]);
        localStorage.removeItem('sfos_token');
        localStorage.removeItem('sfos_user');
    };

    useEffect(() => {
        console.log("🔌 Auth Provider Config:", {
            host: PARTYKIT_HOST,
            protocol: PROTOCOL,
            apiUrl: API_URL,
            mode: import.meta.env.MODE
        });
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, profiles, login, logout, selectProfile, createProfile, fetchProfiles }}>
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
