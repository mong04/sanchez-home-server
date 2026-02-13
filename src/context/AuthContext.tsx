import React, { createContext, useContext, useState, useEffect } from 'react';
import { env } from '../config/env';
import { updateProviderToken } from '../lib/yjs-provider';
import {
    isPasskeySupported,
    registerPasskey as registerPasskeyClient,
    authenticateWithPasskey,
    hasRegisteredPasskeys
} from '../lib/passkey-utils';

import type { User } from '../types/schema';

// API Configuration
const PARTYKIT_HOST = env.PARTYKIT_HOST;
const PROTOCOL = window.location.protocol === 'https:' ? 'https:' : 'http:';
const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    profiles: User[];
    login: (code: string) => Promise<boolean>;
    logout: () => void;
    selectProfile: (profileId: string) => Promise<void>;
    createProfile: (profile: Omit<User, 'id'>) => Promise<void>;
    updateProfile: (profileId: string, updates: Partial<User>) => Promise<void>;
    fetchProfiles: () => Promise<void>;
    // Passkey methods
    passkeySupported: boolean;
    hasPasskeys: boolean;
    registerPasskey: (deviceName?: string) => Promise<{ success: boolean; error?: string }>;
    loginWithPasskey: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Hydrate auth state synchronously from localStorage to prevent flash of airlock on refresh
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('sfos_token');
    });
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('sfos_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('sfos_token');
    });
    const [profiles, setProfiles] = useState<User[]>([]);
    const [passkeySupported] = useState(() => isPasskeySupported());
    const [hasPasskeys, setHasPasskeys] = useState(false);

    useEffect(() => {
        // Fetch profiles and check passkeys on boot (async operations only)
        if (token) {
            fetchProfiles(token);
        }

        // Check if any passkeys are registered
        checkPasskeys();
    }, []);

    const checkPasskeys = async () => {
        if (passkeySupported) {
            const result = await hasRegisteredPasskeys();
            setHasPasskeys(result);
        }
    };

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
            // If 401, clear the invalid session
            if (error instanceof Error && error.message.includes('Unauthorized')) {
                console.log('⚠️ Session expired, clearing...');
                logout();
            } else {
                console.error("Failed to fetch profiles:", error);
            }
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

    const updateProfile = async (profileId: string, updates: Partial<User>) => {
        try {
            await apiRequest(`/family/profiles/${profileId}`, 'PATCH', updates);
            // If updating current user, update session
            if (user?.id === profileId) {
                const updatedUser = { ...user, ...updates };
                handleUserSession(token || '', updatedUser);
            }
            // Refresh profiles list
            await fetchProfiles();
        } catch (error) {
            console.error("Failed to update profile:", error);
        }
    };

    const handleUserSession = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('sfos_token', newToken);
        localStorage.setItem('sfos_user', JSON.stringify(newUser));

        // Update the Yjs provider with the new token
        updateProviderToken(newToken);
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setProfiles([]);
        localStorage.removeItem('sfos_token');
        localStorage.removeItem('sfos_user');
    };

    // Register a passkey for the current user
    const registerPasskey = async (deviceName?: string): Promise<{ success: boolean; error?: string }> => {
        if (!user || !token) {
            return { success: false, error: 'Must be logged in to register passkey' };
        }
        if (!passkeySupported) {
            return { success: false, error: 'Passkeys not supported on this device' };
        }

        const result = await registerPasskeyClient(token, user.id, deviceName);
        if (result.success) {
            setHasPasskeys(true);
        }
        return result;
    };

    // Login using a registered passkey
    const loginWithPasskey = async (): Promise<boolean> => {
        if (!passkeySupported) return false;

        const result = await authenticateWithPasskey();
        if (result.success && result.token && result.user) {
            handleUserSession(result.token, result.user);
            setIsAuthenticated(true);
            await fetchProfiles(result.token);
            return true;
        }
        return false;
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
        <AuthContext.Provider value={{
            isAuthenticated, user, token, profiles,
            login, logout, selectProfile, createProfile, updateProfile, fetchProfiles,
            passkeySupported, hasPasskeys, registerPasskey, loginWithPasskey
        }}>
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
