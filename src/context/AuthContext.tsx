import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { updateProviderToken, disconnectProvider } from '../lib/yjs-provider';
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

                    await fetchProfiles();
                    setUser(currentUser as User);
                    localStorage.setItem('sfos_user', JSON.stringify(currentUser));
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
            } finally {
                if (isMounted) setIsLoading(false);
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
                await fetchProfiles();
                setUser(currentUser as User);
                localStorage.setItem('sfos_user', JSON.stringify(currentUser));
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



    const fetchProfiles = async (): Promise<User[]> => {
        try {
            const data = await adapter.getFullList<User>('users', { sort: 'name' });
            setProfiles(data);
            return data;
        } catch (error) {
            console.error("[AuthContext] Failed to fetch profiles from adapter:", error);
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
            disconnectProvider();

            // 1. Immediately sever local state so the UI reacts instantly
            setIsAuthenticated(false);
            setToken(null);
            setUser(null);
            setProfiles([]);
            localStorage.removeItem('sfos_user');
            Cookies.remove('auth_token');
            sessionStorage.clear();

            // 2. Aggressively wipe the underlying Supabase local storage tokens manually
            // This prevents Supabase from restoring the session if the network call fails
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    localStorage.removeItem(key);
                }
            }

            // 3. Attempt to notify the Supabase server, but timeout if it hangs
            await Promise.race([
                adapter.signOut(),
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
        } catch (err) {
            console.error('[AuthContext] Sign out error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Because Auth users ARE the profiles now, 'selectProfile' is obsolete in a pure DB flow
    // A kid without an email will log in via a PIN flow we will build later, which just sets the currentUser.
    const selectProfile = async () => {
        console.warn(`[selectProfile] is deprecated as profiles are now natively Auth users. Attempting to switch user...`);
        // If we really need this for PIN switching, we'll need a backend-supported "impersonate" or PIN login.
        // For now, this just warns.
        throw new Error("selectProfile is deprecated. Users must log in directly via Supabase Auth.");
    };

    const createProfile = async (profileData: Omit<User, 'id'>) => {
        try {
            // Note: In Supabase, creating a 'user' record in the public table doesn't create an Auth user.
            // We'll just create the public record. Kids can log in via PIN later by looking up this record.
            const newProfile = await adapter.create<User>('users', profileData);
            setProfiles(prev => [...prev, newProfile]);
        } catch (error) {
            console.error("Error creating profile via adapter:", error);
            throw error;
        }
    };

    const updateProfile = async (profileId: string, updates: Partial<User>) => {
        try {
            const updatedProfile = await adapter.update<User>('users', profileId, updates);
            setProfiles(prev => prev.map(p => p.id === profileId ? updatedProfile : p));
            if (user?.id === profileId) {
                setUser(updatedProfile);
                localStorage.setItem('sfos_user', JSON.stringify(updatedProfile));
            }
        } catch (error) {
            console.error("Error updating profile via adapter:", error);
            throw error;
        }
    };

    const updatePassword = async (current: string, newPass: string, confirmPass: string) => {
        // ... (Keep existing implementation)
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
