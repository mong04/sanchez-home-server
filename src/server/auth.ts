import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env';

// Secret key for signing JWTs
const SECRET_KEY = new TextEncoder().encode(env.PARTYKIT_SECRET);

// Debug: Log secret prefix (REMOVE IN PRODUCTION)
console.log('🔐 [Auth] Secret loaded (first 10 chars):', env.PARTYKIT_SECRET.substring(0, 10));

export interface JWTPayload {
    sub: string;     // User ID
    name: string;    // User Name
    role: 'admin' | 'parent' | 'kid';
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
        .setExpirationTime('30d')
        .sign(SECRET_KEY);
}

/**
 * Verifies a JWT and returns the payload if valid.
 * Returns null if invalid or expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as unknown as JWTPayload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

/**
 * TODO: Move this to a proper database or PartyKit storage lookup
 * Validates an invite code.
 */
export async function validateInviteCode(code: string, validCodes: string[] = []): Promise<boolean> {
    // Phase 10a hardcoded + any dynamic codes
    const hardcoded = "SANCHEZ-KIDS-2025";
    return code === hardcoded || validCodes.includes(code);
}
