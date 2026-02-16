import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

// Secret key for signing JWTs
const SECRET_KEY = new TextEncoder().encode(env.PARTYKIT_SECRET);

export interface JWTPayload {
    sub: string;     // User ID
    name: string;    // User Name
    role: 'admin' | 'parent' | 'kid';
    partykit_id?: string; // Linked Profile ID (from PB)
    iat?: number;
    exp?: number;
}

/**
 * Generates a signed JWT for a user.
 * Tokens are valid for 30 days to support "Netflix-style" persistent login.
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // 30 days
        .sign(SECRET_KEY);
}

/**
 * Verifies a locally signed JWT (Magic Links, etc).
 */
export async function verifyLocalToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as JWTPayload;
    } catch (error) {
        // console.error("Local token verification failed:", error); 
        // Expected failure when checking a PB token
        return null;
    }
}

/**
 * Verifies a PocketBase Auth Token by calling the PB API.
 */
export async function verifyPocketBaseToken(token: string, pbUrl?: string): Promise<JWTPayload | null> {
    const url = pbUrl || "http://127.0.0.1:8090";
    try {
        // Minimal fetch implementation compatible with Cloudflare Workers
        const response = await fetch(`${url}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return null;

        const data = await response.json() as { record: { id: string, email: string, name: string, partykit_id?: string } };
        const user = data.record;

        // Map PB User to JWTPayload
        return {
            sub: user.id,
            name: user.name || user.email.split('@')[0],
            role: 'parent', // Default to parent for PB-authenticated users (admin/parent)
            partykit_id: user.partykit_id
        };
    } catch (error) {
        console.error("PB token verification failed:", error);
        if (error instanceof Error) {
            console.error("Error details:", error.message, error.stack);
            if ('cause' in error) console.error("Caused by:", error.cause);
        }
        return null;
    }
}

/**
 * Universal verify function.
 * Tries local token first (faster/offline-ish), then PocketBase token.
 */
export async function verifyToken(token: string, pbUrl?: string): Promise<JWTPayload | null> {
    // 1. Try local (checks signature locally)
    const local = await verifyLocalToken(token);
    if (local) return local;

    // 2. Try PocketBase (remote check)
    return await verifyPocketBaseToken(token, pbUrl);
}

/**
 * Validates an invite code.
 */
export async function validateInviteCode(code: string, validCodes: string[] = []): Promise<boolean> {
    // Only accept dynamically generated invite codes
    return validCodes.includes(code);
}
