/**
 * Passkey (WebAuthn) utilities for client-side registration and authentication
 * Uses @simplewebauthn/browser for cross-platform passkey support
 */
import {
    startRegistration,
    startAuthentication,
    browserSupportsWebAuthn
} from '@simplewebauthn/browser';
import type {
    PublicKeyCredentialCreationOptionsJSON,
    PublicKeyCredentialRequestOptionsJSON,
    RegistrationResponseJSON,
    AuthenticationResponseJSON
} from '@simplewebauthn/browser';
import { env } from '../config/env';

// API Configuration
const PARTYKIT_HOST = env.PARTYKIT_HOST;
const PROTOCOL = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
const API_URL = `${PROTOCOL}//${PARTYKIT_HOST}/parties/main/sanchez-family-os-v1`;

/**
 * Check if the current browser/device supports passkeys
 */
export function isPasskeySupported(): boolean {
    return browserSupportsWebAuthn();
}

/**
 * Register a new passkey for the current user
 * @param token - Current JWT token
 * @param profileId - Profile ID to associate passkey with
 * @param deviceName - Optional name for this device
 */
export async function registerPasskey(
    token: string,
    profileId: string,
    deviceName?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Get registration options from server
        const optionsRes = await fetch(`${API_URL}/passkey/register/options`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileId, deviceName })
        });

        if (!optionsRes.ok) {
            const error = await optionsRes.json();
            return { success: false, error: error.error || 'Failed to get registration options' };
        }

        const options: PublicKeyCredentialCreationOptionsJSON = await optionsRes.json();

        // 2. Create passkey using device biometrics
        let registration: RegistrationResponseJSON;
        try {
            registration = await startRegistration({ optionsJSON: options });
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                return { success: false, error: 'Passkey registration was cancelled' };
            }
            throw err;
        }

        // 3. Verify and store on server
        const verifyRes = await fetch(`${API_URL}/passkey/register/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profileId,
                registration,
                deviceName
            })
        });

        if (!verifyRes.ok) {
            const error = await verifyRes.json();
            return { success: false, error: error.error || 'Failed to verify passkey' };
        }

        return { success: true };

    } catch (err: any) {
        console.error('[Passkey] Registration error:', err);
        return { success: false, error: err.message || 'Passkey registration failed' };
    }
}

/**
 * Authenticate using a registered passkey
 * @returns JWT token if successful, null otherwise
 */
export async function authenticateWithPasskey(): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string
}> {
    try {
        // 1. Get authentication options from server
        const optionsRes = await fetch(`${API_URL}/passkey/auth/options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!optionsRes.ok) {
            const error = await optionsRes.json();
            return { success: false, error: error.error || 'Failed to get auth options' };
        }

        const options: PublicKeyCredentialRequestOptionsJSON = await optionsRes.json();

        // 2. Authenticate using device biometrics
        let authentication: AuthenticationResponseJSON;
        try {
            authentication = await startAuthentication({ optionsJSON: options });
        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                return { success: false, error: 'Passkey authentication was cancelled' };
            }
            throw err;
        }

        // 3. Verify on server and get JWT
        const verifyRes = await fetch(`${API_URL}/passkey/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authentication })
        });

        if (!verifyRes.ok) {
            const error = await verifyRes.json();
            return { success: false, error: error.error || 'Passkey verification failed' };
        }

        const { token, user } = await verifyRes.json();
        return { success: true, token, user };

    } catch (err: any) {
        console.error('[Passkey] Authentication error:', err);
        return { success: false, error: err.message || 'Passkey authentication failed' };
    }
}

/**
 * Check if any passkeys are registered for the current origin
 * Uses Conditional UI / Autofill feature
 */
export async function hasRegisteredPasskeys(): Promise<boolean> {
    try {
        const res = await fetch(`${API_URL}/passkey/check`, {
            method: 'GET'
        });
        if (res.ok) {
            const { hasPasskeys } = await res.json();
            return hasPasskeys;
        }
    } catch {
        // Ignore errors
    }
    return false;
}
