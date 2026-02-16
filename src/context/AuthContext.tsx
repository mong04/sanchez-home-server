import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { env } from '../config/env';
import { updateProviderToken } from '../lib/yjs-provider';
import { pb } from '../lib/pocketbase';
import type { User } from '../types/schema';

// API Configuration (Cleaned up)
// const PARTYKIT_HOST = env.PARTYKIT_HOST; // Removed as unused

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    profiles: User[];
    login: (code: string) => Promise<boolean>; // Deprecated but kept for type compat temporarily
    loginWithPocketBase: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    selectProfile: (profileId: string) => Promise<void>; // Will be used for identity linking later
    createProfile: (profile: Omit<User, 'id'>) => Promise<void>;
    updateProfile: (profileId: string, updates: Partial<User>) => Promise<void>;
    fetchProfiles: (currentToken?: string) => Promise<User[]>;
    updatePassword: (current: string, newPass: string, confirmPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Single Source of Truth: PocketBase AuthStore
    const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
    const [token, setToken] = useState(pb.authStore.token);
    // Initialize from local storage to prevent "Profile Selection" flash
    const [user, setUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('sfos_user');
        return stored ? JSON.parse(stored) : null;
    });
    const [profiles, setProfiles] = useState<User[]>([]);

    useEffect(() => {
        // Sync state with PocketBase AuthStore changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            console.log('🔐 [Auth] PB State Change:', { valid: !!token, user: model?.email });
            setToken(token);
            setIsAuthenticated(!!token);

            // Sync to Cookie for Middleware
            if (token) {
                Cookies.set('auth_token', token, {
                    secure: window.location.protocol === 'https:',
                    sameSite: 'Strict',
                    expires: 7 // 7 days (matching PB default often)
                });
            } else {
                Cookies.remove('auth_token');
            }

            // Sync with PartyKit/Yjs
            updateProviderToken(token);

            // AUTO-LINK: If logged in, fetch profiles and try to resolve identity
            if (token && model) {
                fetchProfiles(token).then((fetchedProfiles) => {
                    const pkId = model.partykit_id; // Custom field we added to PB schema
                    if (pkId) {
                        const profile = fetchedProfiles.find(p => p.id === pkId);
                        if (profile) {
                            console.log("🔗 [Auth] Auto-linked to profile:", profile.name);
                            setUser(profile);
                            localStorage.setItem('sfos_user', JSON.stringify(profile));
                        }
                    } else {
                        // TODO: Implement "Smart Match" or prompt user to select profile
                        console.log("⚠️ [Auth] No PartyKit ID linked to this PB User.");
                        setUser(null);
                    }
                });
            } else {
                setUser(null);
                setProfiles([]);
                localStorage.removeItem('sfos_user');
            }
        });

        // Initial sync on mount
        if (pb.authStore.isValid && pb.authStore.token) {
            // trigger initial fetch/link logic manually since onChange might not fire if already valid
            // simulate the logic above:
            const token = pb.authStore.token;
            const model = pb.authStore.model;

            // Ensure cookie is set on hydration (in case it was cleared or expired but localStorage persisted)
            Cookies.set('auth_token', token, {
                secure: window.location.protocol === 'https:',
                sameSite: 'Strict',
                expires: 7
            });

            updateProviderToken(token);

            fetchProfiles(token).then((fetchedProfiles) => {
                const pkId = model?.partykit_id;
                if (pkId) {
                    const profile = fetchedProfiles.find(p => p.id === pkId);
                    if (profile) {
                        setUser(profile);
                        localStorage.setItem('sfos_user', JSON.stringify(profile));
                    }
                }
            });
        }

        return () => unsubscribe();
    }, []);

    // Helper for PartyKit URL
    const getPartyKitUrl = () => {
        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        return `${protocol}//${env.PARTYKIT_HOST}`;
    };

    const fetchProfiles = async (currentToken?: string): Promise<User[]> => {
        const tokenToUse = currentToken || token;
        if (!tokenToUse) return [];

        try {
            // PartyKit now validates PB token via `verifyPocketBaseToken`
            const response = await fetch(`${getPartyKitUrl()}/family/profiles`, {
                headers: {
                    'Authorization': `Bearer ${tokenToUse}`
                }
            });

            if (response.ok) {
                const data = await response.json() as User[];
                setProfiles(data);
                return data;
            } else {
                console.warn("Failed to fetch profiles:", response.status);
                return [];
            }
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            return [];
        }
    };

    // DEPRECATED: Legacy Invite Code Login
    const login = async (code: string) => {
        console.warn("⚠️ Legacy Invite Code login is deprecated. Use loginWithPocketBase.", code);
        return false;
    };

    const loginWithPocketBase = async (email: string, pass: string) => {
        try {
            await pb.collection('users').authWithPassword(email, pass);
            // onChange hook above handles state updates
            return true;
        } catch (error) {
            console.error("PocketBase login failed:", error);
            // logout() // Optional: clear any partial state
            return false;
        }
    };

    const logout = () => {
        pb.authStore.clear(); // This triggers the onChange hook, clearing state
        setUser(null);
        setProfiles([]);
        localStorage.removeItem('sfos_token'); // Clean up legacy
        localStorage.removeItem('sfos_user');  // Clean up legacy & current
        Cookies.remove('auth_token');
    };

    const selectProfile = async (profileId: string) => {
        if (!pb.authStore.isValid || !pb.authStore.model) {
            console.error("Cannot select profile: No authenticated PocketBase user.");
            return;
        }

        try {
            // 1. Link to PocketBase User
            const pbUserId = pb.authStore.model.id;
            await pb.collection('users').update(pbUserId, {
                partykit_id: profileId
            });

            // 2. Find and Set User
            const selectedProfile = profiles.find(p => p.id === profileId);
            if (selectedProfile) {
                console.log("🔗 [Auth] Linked existing profile:", selectedProfile.name);
                setUser(selectedProfile);
                localStorage.setItem('sfos_user', JSON.stringify(selectedProfile));
            } else {
                // If not in current list, fetch it (edge case)
                const freshProfiles = await fetchProfiles();
                const freshProfile = freshProfiles.find(p => p.id === profileId);
                if (freshProfile) {
                    setUser(freshProfile);
                    localStorage.setItem('sfos_user', JSON.stringify(freshProfile));
                }
            }

        } catch (error) {
            console.error("Error selecting profile:", error);
            throw error;
        }
    };

    const createProfile = async (profileData: Omit<User, 'id'>) => {
        if (!pb.authStore.isValid || !pb.authStore.model) {
            console.error("Cannot create profile: No authenticated PocketBase user.");
            return;
        }

        try {
            // Generate a specialized ID for the profile (distinct from PB User ID)
            const newProfileId = crypto.randomUUID();
            const newProfile: User = {
                ...profileData,
                id: newProfileId,
            };

            // 1. Create Profile in PartyKit (Source of Truth for "Social" data)
            const response = await fetch(`${getPartyKitUrl()}/family/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Use PB token to authorize
                },
                body: JSON.stringify(newProfile)
            });

            if (!response.ok) {
                throw new Error(`Failed to create profile: ${response.statusText}`);
            }

            // 2. Link to PocketBase User
            const pbUserId = pb.authStore.model.id;
            await pb.collection('users').update(pbUserId, {
                partykit_id: newProfileId
            });

            console.log("✅ [Auth] Profile created and linked:", newProfile.name);

            // 3. Update Local State
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

            if (!response.ok) {
                throw new Error(`Failed to update profile: ${response.statusText}`);
            }

            const updatedProfile = await response.json();

            // Update local state
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
        if (!pb.authStore.isValid || !pb.authStore.model) {
            throw new Error("Not authenticated");
        }

        try {
            const userId = pb.authStore.model.id;
            const email = pb.authStore.model.email;

            // 1. Update Password
            await pb.collection('users').update(userId, {
                oldPassword: current,
                password: newPass,
                passwordConfirm: confirmPass,
            });

            // 2. Silent Re-Auth to keep session alive
            await pb.collection('users').authWithPassword(email, newPass);

            console.log("✅ [Auth] Password updated and session refreshed");

        } catch (error: any) {
            console.error("Failed to update password:", error);

            // Map PocketBase errors to user friendly messages
            if (error?.status === 400) {
                const data = error?.response?.data;
                if (data?.oldPassword) throw new Error("Incorrect current password");
                if (data?.password) throw new Error(data.password.message);
                if (data?.passwordConfirm) throw new Error(data.passwordConfirm.message);
            }

            throw new Error(error.message || "Failed to update password");
        }
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated, user, token, profiles,
            login, loginWithPocketBase, logout,
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
