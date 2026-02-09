/**
 * Server-side passkey (WebAuthn) utilities
 * Uses @simplewebauthn/server for FIDO2 operations
 */
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
    VerifiedRegistrationResponse,
    VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON,
    AuthenticatorTransportFuture,
} from '@simplewebauthn/server';

// Base64URL encoding utilities (edge-runtime compatible)
function uint8ArrayToBase64Url(arr: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...arr));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlToUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes as Uint8Array<ArrayBuffer>;
}

// Relying Party (RP) information - identifies your app to the authenticator
const RP_NAME = 'Sanchez Family OS';
// RP_ID should match your domain (without protocol/port)
// This will be set dynamically based on the request origin
function getRpId(origin: string | null): string {
    if (!origin) return 'localhost';
    try {
        const url = new URL(origin);
        return url.hostname;
    } catch {
        return 'localhost';
    }
}

// Passkey credential stored per profile
export interface PasskeyCredential {
    credentialId: string;        // Base64URL encoded
    publicKey: string;           // Base64URL encoded
    counter: number;             // Replay attack prevention
    createdAt: number;
    deviceName?: string;
    transports?: AuthenticatorTransportFuture[];
}

// Profile with passkey support
export interface ProfileWithPasskeys {
    id: string;
    name: string;
    role: 'admin' | 'parent' | 'kid';
    avatar?: string;
    passkeys?: PasskeyCredential[];
}

// Challenge storage (temporary, keyed by profileId or session)
const challenges = new Map<string, string>();

/**
 * Generate options for passkey registration
 */
export async function generatePasskeyRegistrationOptions(
    profile: ProfileWithPasskeys,
    origin: string | null
): Promise<any> {
    const rpId = getRpId(origin);
    const existingCredentials = (profile.passkeys || []).map(pk => ({
        id: pk.credentialId,
        transports: pk.transports,
    }));

    const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: rpId,
        userName: profile.name,
        userID: new TextEncoder().encode(profile.id),
        userDisplayName: profile.name,
        attestationType: 'none', // We don't need attestation for family app
        excludeCredentials: existingCredentials.map(cred => ({
            id: cred.id,
            transports: cred.transports,
        })),
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
            authenticatorAttachment: 'platform', // Prefer built-in (Face ID, fingerprint)
        },
    });

    // Store challenge for verification
    challenges.set(profile.id, options.challenge);

    return options;
}

/**
 * Verify passkey registration response and return credential to store
 */
export async function verifyPasskeyRegistration(
    profileId: string,
    registration: RegistrationResponseJSON,
    origin: string | null,
    deviceName?: string
): Promise<{ success: boolean; credential?: PasskeyCredential; error?: string }> {
    const expectedChallenge = challenges.get(profileId);
    if (!expectedChallenge) {
        return { success: false, error: 'Challenge expired or not found' };
    }

    const rpId = getRpId(origin);
    const expectedOrigin = origin || `https://${rpId}`;

    try {
        const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
            response: registration,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpId,
            requireUserVerification: false, // Allow devices without biometrics
        });

        if (!verification.verified || !verification.registrationInfo) {
            return { success: false, error: 'Verification failed' };
        }

        // Clean up challenge
        challenges.delete(profileId);

        // Create credential to store
        const credId = verification.registrationInfo.credential.id;
        const pubKey = verification.registrationInfo.credential.publicKey;
        const credential: PasskeyCredential = {
            credentialId: typeof credId === 'string' ? credId : uint8ArrayToBase64Url(credId),
            publicKey: typeof pubKey === 'string' ? pubKey : uint8ArrayToBase64Url(pubKey),
            counter: verification.registrationInfo.credential.counter,
            createdAt: Date.now(),
            deviceName,
            transports: registration.response.transports,
        };

        return { success: true, credential };

    } catch (err: any) {
        console.error('[Passkey] Registration verification error:', err);
        return { success: false, error: err.message || 'Verification error' };
    }
}

/**
 * Generate options for passkey authentication
 */
export async function generatePasskeyAuthOptions(
    allProfiles: ProfileWithPasskeys[],
    origin: string | null
): Promise<{ options: any; sessionId: string }> {
    const rpId = getRpId(origin);

    // Collect all registered passkeys across all profiles
    const allowCredentials = allProfiles.flatMap(profile =>
        (profile.passkeys || []).map(pk => ({
            id: pk.credentialId,
            transports: pk.transports,
        }))
    );

    const options = await generateAuthenticationOptions({
        rpID: rpId,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
        userVerification: 'preferred',
    });

    // Store challenge with a session ID
    const sessionId = crypto.randomUUID();
    challenges.set(sessionId, options.challenge);

    return { options, sessionId };
}

/**
 * Verify passkey authentication and return matching profile
 */
export async function verifyPasskeyAuthentication(
    authentication: AuthenticationResponseJSON,
    allProfiles: ProfileWithPasskeys[],
    origin: string | null,
    sessionId?: string
): Promise<{ success: boolean; profile?: ProfileWithPasskeys; error?: string }> {
    // Find the profile that owns this credential
    let matchingProfile: ProfileWithPasskeys | undefined;
    let matchingCredential: PasskeyCredential | undefined;

    for (const profile of allProfiles) {
        const cred = (profile.passkeys || []).find(
            pk => pk.credentialId === authentication.id
        );
        if (cred) {
            matchingProfile = profile;
            matchingCredential = cred;
            break;
        }
    }

    if (!matchingProfile || !matchingCredential) {
        return { success: false, error: 'Passkey not found' };
    }

    // Get challenge (try sessionId first, then profileId for backward compat)
    const expectedChallenge = sessionId
        ? challenges.get(sessionId)
        : challenges.get(matchingProfile.id);

    if (!expectedChallenge) {
        return { success: false, error: 'Challenge expired' };
    }

    const rpId = getRpId(origin);
    const expectedOrigin = origin || `https://${rpId}`;

    try {
        const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
            response: authentication,
            expectedChallenge,
            expectedOrigin,
            expectedRPID: rpId,
            credential: {
                id: matchingCredential.credentialId,
                publicKey: base64UrlToUint8Array(matchingCredential.publicKey),
                counter: matchingCredential.counter,
                transports: matchingCredential.transports,
            },
            requireUserVerification: false,
        });

        if (!verification.verified) {
            return { success: false, error: 'Authentication failed' };
        }

        // Clean up challenge
        if (sessionId) challenges.delete(sessionId);

        // Update counter for replay protection (caller should persist this)
        matchingCredential.counter = verification.authenticationInfo.newCounter;

        return { success: true, profile: matchingProfile };

    } catch (err: any) {
        console.error('[Passkey] Authentication verification error:', err);
        return { success: false, error: err.message || 'Verification error' };
    }
}
