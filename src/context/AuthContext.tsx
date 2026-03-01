import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { env } from '../config/env';
import { updateProviderToken } from '../lib/yjs-provider';
import { useBackend } from '../providers/BackendProvider';
import type { User } from '../types/schema';

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    profiles: User[];

    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    selectProfile: (profileId: string) => Promise<void>;
    createProfile: (profile: Omit<User, 'id'>) => Promise<void>;
    updateProfile: (profileId: string, updates: Partial<User>) => Promise<void>;
    fetchProfiles: (currentToken?: string) => Promise<User[]>;
    updatePassword: (current: string, newPass: string, confirmPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { adapter } = useBackend();

    const [isAuthenticated, setIsAuthenticated] = useState(() => adapter.getCurrentUser() !== null);
    const [token, setToken] = useState(() => adapter.getToken());
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('sfos_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [profiles, setProfiles] = useState<User[]>([]);

    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Wait for the adapter to confidently resolve the initial session
                const { user: currentUser, token: currentToken } = await adapter.initializeAuth();

                if (!isMounted) return;

                if (currentToken && currentUser) {
                    setIsAuthenticated(true);
                    setToken(currentToken);
                    Cookies.set('auth_token', currentToken, {
                        secure: window.location.protocol === 'https:',
                        sameSite: 'Strict',
                        expires: 7
                    });
                    updateProviderToken(currentToken);

                    const fetchedProfiles = await fetchProfiles(currentToken);
                    const pkId = (currentUser as any).partykit_id;
                    if (pkId) {
                        const profile = fetchedProfiles.find(p => p.id === pkId);
                        if (profile) {
                            setUser(profile);
                            localStorage.setItem('sfos_user', JSON.stringify(profile));
                        }
                    } else {
                        setUser(currentUser as User);
                    }
                } else {
                    // Confirmed no session
                    setIsAuthenticated(false);
                    setToken(null);
                    setUser(null);
                    setProfiles([]);
                    Cookies.remove('auth_token');
                    localStorage.removeItem('sfos_user');
                }
            } catch (error) {
                console.error('[AuthContext] Failed to initialize auth:', error);
            } finally {
                if (isMounted) setIsInitialized(true);
            }
        };

        initAuth();

        const unsubscribe = adapter.onAuthStateChange(async (currentUser) => {
            if (!isMounted || !isInitialized) return; // Ignore mid-init flutter

            const currentToken = adapter.getToken();
            console.log('🔐 [Auth] Backend State Change:', { valid: !!currentToken, user: currentUser?.email });

            setToken(currentToken);
            setIsAuthenticated(!!currentToken);

            if (currentToken) {
                Cookies.set('auth_token', currentToken, {
                    secure: window.location.protocol === 'https:',
                    sameSite: 'Strict',
                    expires: 7
                });
                updateProviderToken(currentToken);
            } else {
                Cookies.remove('auth_token');
            }

            if (currentToken && currentUser) {
                const fetchedProfiles = await fetchProfiles(currentToken);
                const pkId = (currentUser as any).partykit_id;

                if (pkId) {
                    const profile = fetchedProfiles.find(p => p.id === pkId);
                    if (profile) {
                        setUser(profile);
                        localStorage.setItem('sfos_user', JSON.stringify(profile));
                    }
                }
            } else {
                setUser(null);
                setProfiles([]);
                localStorage.removeItem('sfos_user');
            }
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [adapter]);

    const getPartyKitUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${env.PARTYKIT_HOST}`;
    };

    const fetchProfiles = async (currentToken?: string): Promise<User[]> => {
        const tokenToUse = currentToken || token;
        if (!tokenToUse) return [];

        try {
            const response = await fetch(`${getPartyKitUrl()}/family/profiles`, {
                headers: {
                    'Authorization': `Bearer ${tokenToUse}`
                }
            });

            if (response.ok) {
                const data = await response.json() as User[];
                setProfiles(data);
                return data;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            return [];
        }
    };

    const login = async (email: string, pass: string) => {
        try {
            await adapter.signIn(email, pass);
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const logout = () => {
        adapter.signOut();
        setUser(null);
        setProfiles([]);
        localStorage.removeItem('sfos_user');
        Cookies.remove('auth_token');
    };

    const selectProfile = async (profileId: string) => {
        const currentUser = adapter.getCurrentUser();
        if (!currentUser) return;

        try {
            await adapter.update('users', currentUser.id, { partykit_id: profileId });
            const selectedProfile = profiles.find(p => p.id === profileId);
            if (selectedProfile) {
                setUser(selectedProfile);
                localStorage.setItem('sfos_user', JSON.stringify(selectedProfile));
            }
        } catch (error) {
            console.error("Error selecting profile:", error);
            throw error;
        }
    };

    const createProfile = async (profileData: Omit<User, 'id'>) => {
        const currentUser = adapter.getCurrentUser();
        if (!currentUser) return;

        try {
            const newProfileId = crypto.randomUUID();
            const newProfile: User = { ...profileData, id: newProfileId };
            const response = await fetch(`${getPartyKitUrl()}/family/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newProfile)
            });

            if (!response.ok) throw new Error("Failed to create profile");

            await adapter.update('users', currentUser.id, { partykit_id: newProfileId });
            setUser(newProfile);
            localStorage.setItem('sfos_user', JSON.stringify(newProfile));
            setProfiles(prev => [...prev, newProfile]);
        } catch (error) {
            console.error("Error creating profile:", error);
            throw error;
        }
    };

    const updateProfile = async (profileId: string, updates: Partial<User>) => {
        try {
            const response = await fetch(`${getPartyKitUrl()}/family/profiles/${profileId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) throw new Error("Failed to update profile");
            const updatedProfile = await response.json();
            setProfiles(prev => prev.map(p => p.id === profileId ? updatedProfile : p));
            if (user?.id === profileId) {
                setUser(updatedProfile);
                localStorage.setItem('sfos_user', JSON.stringify(updatedProfile));
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    };

    const updatePassword = async (current: string, newPass: string, confirmPass: string) => {
        const currentUser = adapter.getCurrentUser();
        if (!currentUser) throw new Error("Not authenticated");

        try {
            await adapter.update('users', currentUser.id, {
                oldPassword: current,
                password: newPass,
                passwordConfirm: confirmPass,
            });
            await adapter.signIn(currentUser.email, newPass);
        } catch (error: any) {
            console.error("Failed to update password:", error);
            throw new Error(error.message || "Failed to update password");
        }
    };

    if (!isInitialized) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated, user, token, profiles,
            login, logout,
            selectProfile, createProfile, updateProfile, fetchProfiles,
            updatePassword
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
