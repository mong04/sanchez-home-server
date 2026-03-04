import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { env } from '../config/env';
import { updateProviderToken } from '../lib/yjs-provider';
import { useBackend } from '../providers/BackendProvider';
import type { User } from '../types/schema';

interface AuthContextType {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    profiles: User[];

    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => Promise<void>;
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
        try {
            const stored = localStorage.getItem('sfos_user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object' && 'id' in parsed) {
                    return parsed as User;
                }
            }
        } catch {
            // invalid JSON 
        }
        return null;
    });
    const [profiles, setProfiles] = useState<User[]>([]);


    const [isLoading, setIsLoading] = useState(true);

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
                        localStorage.setItem('sfos_user', JSON.stringify(currentUser));
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
                // No longer needed
            }
        };

        initAuth();

        const unsubscribe = adapter.onAuthStateChange(async (currentUser) => {
            if (!isMounted) return;

            const currentToken = adapter.getToken();

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
                        const fullUser = { ...profile, partykit_id: pkId };
                        setUser(fullUser);
                        localStorage.setItem('sfos_user', JSON.stringify(fullUser));
                    }
                } else {
                    setUser(currentUser as User);
                    localStorage.setItem('sfos_user', JSON.stringify(currentUser));
                }
            } else {
                setUser(null);
                setProfiles([]);
                localStorage.removeItem('sfos_user');
            }
            if (isMounted) setIsLoading(false);
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

    const logout = async () => {
        setIsLoading(true);
        try {
            await adapter.signOut();
        } catch (err) {
            console.error('[AuthContext] Sign out error:', err);
        } finally {
            setIsAuthenticated(false);
            setToken(null);
            setUser(null);
            setProfiles([]);
            localStorage.removeItem('sfos_user');
            Cookies.remove('auth_token');
            sessionStorage.clear();
            setIsLoading(false);
        }
    };

    const selectProfile = async (profileId: string) => {
        console.log(`[selectProfile] Called with profileId:`, profileId);
        const currentUser = adapter.getCurrentUser();
        console.log(`[selectProfile] adapter.getCurrentUser() returned:`, currentUser);

        if (!currentUser) {
            throw new Error(`[selectProfile] FATAL: currentUser is null! Adapter is not authenticated.`);
        }

        try {
            console.log(`[selectProfile] Calling adapter.update for user ID:`, currentUser.id);
            await adapter.update('users', currentUser.id, { partykit_id: profileId });
            console.log(`[selectProfile] adapter.update SUCCESS!`);

            const selectedProfile = profiles.find(p => p.id === profileId);
            if (selectedProfile) {
                const fullUser = { ...selectedProfile, partykit_id: profileId };
                console.log(`[selectProfile] Setting fullUser:`, fullUser);
                setUser(fullUser);
                localStorage.setItem('sfos_user', JSON.stringify(fullUser));
            } else {
                console.warn(`[selectProfile] Warning: Profile not found in 'profiles' array!`);
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
            const fullUser = { ...newProfile, partykit_id: newProfileId };
            setUser(fullUser);
            localStorage.setItem('sfos_user', JSON.stringify(fullUser));
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
                const fullUser = { ...updatedProfile, partykit_id: profileId };
                setUser(fullUser);
                localStorage.setItem('sfos_user', JSON.stringify(fullUser));
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



    return (
        <AuthContext.Provider value={{
            isLoading, isAuthenticated, user, token, profiles,
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
