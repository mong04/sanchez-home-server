import { SignJWT, jwtVerify } from 'jose';

// Secret key is now lazily resolved to support both:
// 1. Vite client-side (import.meta.env)
// 2. PartyKit/Cloudflare Workers (this.room.env, passed as parameter)
//
// The module-level `env` import was causing failures in the PartyKit runtime
// because `import.meta.env` and `process.env` don't exist in Cloudflare Workers.

function getSecretKey(secret?: string): Uint8Array {
    if (secret) {
        return new TextEncoder().encode(secret);
    }

    // Fallback: try to read from import.meta.env (Vite client builds)
    try {
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            const envSecret = import.meta.env.VITE_PARTYKIT_SECRET || import.meta.env.PARTYKIT_SECRET;
            if (envSecret) return new TextEncoder().encode(envSecret);
        }
    } catch { /* Not in Vite context */ }

    // Fallback: try process.env (Node.js)
    try {
        // @ts-ignore - process may not exist
        if (typeof process !== 'undefined' && process.env?.PARTYKIT_SECRET) {
            // @ts-ignore
            return new TextEncoder().encode(process.env.PARTYKIT_SECRET);
        }
    } catch { /* Not in Node context */ }

    console.error('❌ [Auth] No PARTYKIT_SECRET found in any environment');
    return new TextEncoder().encode('fallback-insecure-key-not-for-production');
}

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
 * @param secret - The signing secret (pass from this.room.env in PartyKit)
 */
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, secret?: string): Promise<string> {
    return await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // 30 days
        .sign(getSecretKey(secret));
}

/**
 * Verifies a locally signed JWT (Magic Links, etc).
 * @param secret - The signing secret (pass from this.room.env in PartyKit)
 */
export async function verifyLocalToken(token: string, secret?: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey(secret));
        return payload as unknown as JWTPayload;
    } catch {
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

        return {
            sub: user.id,
            name: user.name || user.email.split('@')[0],
            role: 'parent',
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
 * Tries local token first (faster), then PocketBase token.
 * @param secret - The signing secret (pass from this.room.env in PartyKit)
 */
export async function verifyToken(token: string, pbUrl?: string, secret?: string): Promise<JWTPayload | null> {
    // 1. Try local (checks signature locally)
    const local = await verifyLocalToken(token, secret);
    if (local) return local;

    // 2. Try PocketBase (remote check)
    return await verifyPocketBaseToken(token, pbUrl);
}

/**
 * Validates an invite code.
 */
export async function validateInviteCode(code: string, validCodes: string[] = []): Promise<boolean> {
    return validCodes.includes(code);
}
