import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import { signToken, verifyToken } from "./auth";
import {
    generatePasskeyRegistrationOptions,
    verifyPasskeyRegistration,
    generatePasskeyAuthOptions,
    verifyPasskeyAuthentication,
    type ProfileWithPasskeys,
} from "./passkey";

// Allowed origins for CORS - restrict to actual deployment domains
const ALLOWED_ORIGINS = [
    'https://sanchez-family-os.vercel.app',
    'https://sanchez-home-server.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
];

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    // Allow exact matches
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    // Allow any Vercel preview deployment (*.vercel.app)
    if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) return true;
    // Allow any localhost port for dev flexibility
    if (origin.startsWith('http://localhost:')) return true;
    if (origin.startsWith('http://127.0.0.1:')) return true;
    return false;
}

function getCorsHeaders(origin: string | null): Record<string, string> {
    const allowedOrigin = isAllowedOrigin(origin) && origin ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PATCH, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Recovery-Key",
        "Access-Control-Allow-Credentials": "true",
    };
}

export default class Server implements Party.Server {
    room: Party.Room;
    constructor(room: Party.Room) {
        this.room = room;
    }

    static async onFetch(req: Party.Request, lobby: Party.FetchLobby) {
        const url = new URL(req.url);
        const origin = req.headers.get('Origin');
        const CORS_HEADERS = getCorsHeaders(origin);

        // Handle preflight OPTIONS explicitly for global requests
        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        // Forward API requests to the "main" room
        if (url.pathname.startsWith("/family") ||
            url.pathname.startsWith("/auth") ||
            url.pathname.startsWith("/admin") ||
            url.pathname.startsWith("/passkey")) {

            console.log(`🔀 [PartyKit] Forwarding ${req.method} ${url.pathname} to room 'sanchez-family-os-v1'`);

            // Forward the request to the main room with the original path stored in a header
            // Manual header copy to avoid Type conflicts between DOM and Cloudflare types
            const headers: Record<string, string> = {};
            req.headers.forEach((value, key) => {
                headers[key] = value;
            });
            headers["X-Target-Path"] = url.pathname;

            // Use pathname + search for the stub fetch to avoid "Path must start with /" errors
            // if it misinterprets full URLs
            const target = url.pathname + url.search;

            return lobby.parties.main.get("sanchez-family-os-v1").fetch(target, {
                method: req.method,
                headers: headers as any, // Cast to any to avoid DOM vs Cloudflare Headers type conflict
                body: req.body,
                // @ts-ignore - PartyKit types might complain about duplex, but it's needed for streaming if applicable
                duplex: 'half'
            });
        }

        return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    async onRequest(req: Party.Request): Promise<Response> {
        const origin = req.headers.get('Origin');
        const url = new URL(req.url);

        // Use X-Target-Path if valid (from onFetch forwarding), otherwise use url.pathname
        const targetPath = req.headers.get("X-Target-Path") || url.pathname;

        console.log(`🌍 [PartyKit] ${req.method} ${targetPath} (Real: ${url.pathname}) | Origin: ${origin || 'null'}`);
        const CORS_HEADERS = getCorsHeaders(origin);

        // Handle preflight OPTIONS explicitly and early
        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        try {
            const url = new URL(req.url);



            // --- ADMIN: EMERGENCY RECOVERY (No Auth Required - uses separate secret) ---
            if (url.pathname.endsWith("/admin/recover") && req.method === "POST") {
                const recoveryKey = req.headers.get("X-Recovery-Key");
                const expectedKey = this.room.env.RECOVERY_SECRET as string | undefined;

                if (!expectedKey) {
                    console.error('❌ [Recovery] RECOVERY_SECRET not configured');
                    return Response.json({ error: "Recovery not configured" }, { status: 500, headers: CORS_HEADERS });
                }

                if (recoveryKey !== expectedKey) {
                    console.log('❌ [Recovery] Invalid recovery key attempt');
                    return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
                }

                // Generate recovery invite code
                const code = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
                const invites = await this.room.storage.get<string[]>("invites") || [];
                invites.push(code);
                await this.room.storage.put("invites", invites);

                console.log('🔐 [Recovery] Emergency invite code generated');
                return Response.json({ code, message: "Recovery code generated successfully" }, { headers: CORS_HEADERS });
            }

            // --- PUBLIC: PASSKEY AUTH ---
            if (url.pathname.endsWith("/passkey/auth/options") && req.method === "POST") {
                const profiles = await this.room.storage.get<ProfileWithPasskeys[]>("profiles") || [];
                const { options, sessionId } = await generatePasskeyAuthOptions(profiles, origin);
                return Response.json({ ...options, sessionId }, { headers: CORS_HEADERS });
            }

            if (url.pathname.endsWith("/passkey/auth/verify") && req.method === "POST") {
                const body = await req.json() as { authentication: any; sessionId?: string };
                const profiles = await this.room.storage.get<ProfileWithPasskeys[]>("profiles") || [];

                const result = await verifyPasskeyAuthentication(
                    body.authentication,
                    profiles,
                    origin,
                    body.sessionId
                );

                if (!result.success || !result.profile) {
                    return Response.json({ error: result.error }, { status: 401, headers: CORS_HEADERS });
                }

                // Update counter in storage
                await this.room.storage.put("profiles", profiles);

                // Issue JWT for the authenticated profile
                const jwtToken = await signToken({
                    sub: result.profile.id,
                    name: result.profile.name,
                    role: result.profile.role
                }, this.room.env.PARTYKIT_SECRET as string);

                console.log('🔑 [Passkey] Authenticated:', result.profile.name);
                return Response.json({ token: jwtToken, user: result.profile }, { headers: CORS_HEADERS });
            }

            if (url.pathname.endsWith("/passkey/check") && req.method === "GET") {
                const profiles = await this.room.storage.get<ProfileWithPasskeys[]>("profiles") || [];
                const hasPasskeys = profiles.some(p => (p.passkeys || []).length > 0);
                return Response.json({ hasPasskeys }, { headers: CORS_HEADERS });
            }

            const authHeader = req.headers.get("Authorization");
            const token = authHeader?.split(" ")[1];
            const config = {
                pbUrl: (this.room.env.POCKETBASE_URL as string) || "http://127.0.0.1:8090",
                supabaseUrl: (this.room.env.SUPABASE_URL as string) || (this.room.env.VITE_SUPABASE_URL as string),
                supabaseAnonKey: (this.room.env.SUPABASE_ANON_KEY as string) || (this.room.env.VITE_SUPABASE_PUBLISHABLE_KEY as string),
            };

            const payload = token ? await verifyToken(token, config, this.room.env.PARTYKIT_SECRET as string) : null;

            if (!payload) {
                return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
            }

            // --- AUTH: SWITCH PROFILE (SESSION) ---
            if (url.pathname.endsWith("/auth/session") && req.method === "POST") {
                const body = await req.json() as { profileId: string };
                const profiles = await this.room.storage.get<any[]>("profiles") || [];
                const profile = profiles.find(p => p.id === body.profileId);

                if (!profile) {
                    return Response.json({ error: "Profile not found" }, { status: 404, headers: CORS_HEADERS });
                }

                // Issue token for this specific user
                const token = await signToken({
                    sub: profile.id,
                    name: profile.name,
                    role: profile.role
                }, this.room.env.PARTYKIT_SECRET as string);

                return Response.json({ token, user: profile }, { headers: CORS_HEADERS });
            }

            // --- API: PROFILES ---
            if (url.pathname.endsWith("/family/profiles")) {
                if (req.method === "GET") {
                    const profiles = await this.room.storage.get("profiles") || [];
                    return Response.json(profiles, { headers: CORS_HEADERS });
                }

                if (req.method === "POST") {
                    const profile = await req.json() as any;
                    const profiles = await this.room.storage.get<any[]>("profiles") || [];

                    // Idempotent: Update if exists, else add
                    const index = profiles.findIndex((p: any) => p.id === profile.id);
                    if (index >= 0) {
                        profiles[index] = profile;
                    } else {
                        profiles.push(profile);
                    }

                    await this.room.storage.put("profiles", profiles);

                    // Re-issue token with REAL identity
                    const newToken = await signToken({
                        sub: profile.id,
                        name: profile.name,
                        role: profile.role
                    }, this.room.env.PARTYKIT_SECRET as string);

                    return Response.json({ token: newToken, user: profile }, { headers: CORS_HEADERS });
                }
            }

            // --- API: PROFILE UPDATE (PATCH) ---
            // Regex to match /family/profiles/:id
            const profileUpdateMatch = url.pathname.match(/\/family\/profiles\/([^\/]+)$/);
            if (profileUpdateMatch) {
                const getProfileId = profileUpdateMatch[1];
                const profiles = await this.room.storage.get<any[]>("profiles") || [];
                const index = profiles.findIndex(p => p.id === getProfileId);

                if (index === -1) {
                    return Response.json({ error: "Profile not found" }, { status: 404, headers: CORS_HEADERS });
                }

                if (req.method === "PATCH") {
                    // Verify user is updating their own profile OR is an admin/parent
                    if (payload.sub !== getProfileId && payload.role !== "admin" && payload.role !== "parent") {
                        return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
                    }

                    const updates = await req.json() as any;

                    // SECURITY: Only admins/parents can change roles
                    if (updates.role && updates.role !== profiles[index].role) {
                        if (payload.role !== "admin" && payload.role !== "parent") {
                            console.warn(`⚠️ [Security] Unauthorized role change attempt by ${payload.name}`);
                            return Response.json({ error: "Forbidden: Only admins can change roles" }, { status: 403, headers: CORS_HEADERS });
                        }
                    }

                    // Merge updates
                    const updatedProfile = { ...profiles[index], ...updates };
                    profiles[index] = updatedProfile;

                    await this.room.storage.put("profiles", profiles);

                    console.log(`👤 [Profile] Updated profile for: ${updatedProfile.name}`);
                    return Response.json(updatedProfile, { headers: CORS_HEADERS });
                }

                if (req.method === "DELETE") {
                    // SECURITY: Only admins/parents can delete users
                    if (payload.role !== "admin" && payload.role !== "parent") {
                        return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
                    }

                    // Prevent deleting yourself (to avoid lockout)
                    if (payload.sub === getProfileId) {
                        return Response.json({ error: "Cannot delete your own account" }, { status: 400, headers: CORS_HEADERS });
                    }

                    profiles.splice(index, 1);
                    await this.room.storage.put("profiles", profiles);

                    console.log(`🗑️ [Profile] Deleted user: ${getProfileId}`);
                    return Response.json({ success: true }, { headers: CORS_HEADERS });
                }
            }



            // --- PASSKEY: REGISTRATION OPTIONS ---
            if (url.pathname.endsWith("/passkey/register/options") && req.method === "POST") {
                const body = await req.json() as { profileId: string; deviceName?: string };
                const profiles = await this.room.storage.get<ProfileWithPasskeys[]>("profiles") || [];
                const profile = profiles.find(p => p.id === body.profileId);

                if (!profile) {
                    return Response.json({ error: "Profile not found" }, { status: 404, headers: CORS_HEADERS });
                }

                const options = await generatePasskeyRegistrationOptions(profile, origin);
                return Response.json(options, { headers: CORS_HEADERS });
            }

            // --- PASSKEY: REGISTRATION VERIFY ---
            if (url.pathname.endsWith("/passkey/register/verify") && req.method === "POST") {
                const body = await req.json() as { profileId: string; registration: any; deviceName?: string };
                const profiles = await this.room.storage.get<ProfileWithPasskeys[]>("profiles") || [];
                const profileIndex = profiles.findIndex(p => p.id === body.profileId);

                if (profileIndex === -1) {
                    return Response.json({ error: "Profile not found" }, { status: 404, headers: CORS_HEADERS });
                }

                const result = await verifyPasskeyRegistration(
                    body.profileId,
                    body.registration,
                    origin,
                    body.deviceName
                );

                if (!result.success || !result.credential) {
                    return Response.json({ error: result.error }, { status: 400, headers: CORS_HEADERS });
                }

                // Add passkey to profile
                if (!profiles[profileIndex].passkeys) {
                    profiles[profileIndex].passkeys = [];
                }
                profiles[profileIndex].passkeys!.push(result.credential);
                await this.room.storage.put("profiles", profiles);

                console.log('🔑 [Passkey] Registered for:', profiles[profileIndex].name);
                return Response.json({ success: true }, { headers: CORS_HEADERS });
            }



            return new Response("Not Found", { status: 404, headers: CORS_HEADERS });

        } catch (e) {
            console.error("🔥 [PartyKit] Unhandled Error:", e);
            return Response.json({ error: "Internal Server Error" }, { status: 500, headers: CORS_HEADERS });
        }
    }

    async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
        const token = new URL(conn.uri).searchParams.get("token");

        console.log('🔌 [PartyKit] Connection attempt:', {
            hasToken: !!token,
            tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
        });

        // Verify token properly (Async)
        const config = {
            pbUrl: (this.room.env.POCKETBASE_URL as string) || "http://127.0.0.1:8090",
            supabaseUrl: (this.room.env.SUPABASE_URL as string) || (this.room.env.VITE_SUPABASE_URL as string),
            supabaseAnonKey: (this.room.env.SUPABASE_ANON_KEY as string) || (this.room.env.VITE_SUPABASE_PUBLISHABLE_KEY as string),
        };

        const payload = token ? await verifyToken(token, config, this.room.env.PARTYKIT_SECRET as string) : null;

        console.log('🔍 [PartyKit] Token verification result:', {
            valid: !!payload,
            payload: payload ? { sub: payload.sub, name: payload.name, role: payload.role } : null
        });

        if (!payload) {
            console.log('❌ [PartyKit] Closing connection - unauthorized');
            return conn.close(4001, "Unauthorized");
        }

        console.log('✅ [PartyKit] Connection authorized for:', payload.name);

        return onConnect(conn, this.room, {
            persist: true
        });
    }
}
