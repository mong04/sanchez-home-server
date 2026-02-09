import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import { signToken, verifyToken, validateInviteCode } from "./auth";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default class Server implements Party.Server {
    room: Party.Room;
    constructor(room: Party.Room) {
        this.room = room;
    }

    async onRequest(req: Party.Request): Promise<Response> {
        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: CORS_HEADERS });
        }

        const url = new URL(req.url);

        // --- AUTH: LOGIN ---
        if (req.method === "POST" && url.pathname.endsWith("/auth/login")) {
            const body = await req.json() as { code: string };
            const storedInvites = await this.room.storage.get<string[]>("invites") || [];

            if (await validateInviteCode(body.code, storedInvites)) {
                // Issue a temporary token for profile selection (or full access if we knew the user)
                // For now, we issue a "pre-auth" token or just a generic one.
                // Since we don't know the USER yet, we can't fully sign it with role.
                // WE WILL ISSUE A GENERIC "FAMILY" TOKEN first.
                // ACTUALLY, let's keep it simple: Invite Code -> Valid Token with "guest" or "pending" role?
                // OR, checking the plan: "Profile Selection -> App".
                // So this token allows reading profiles.
                const token = await signToken({ sub: "pending", name: "Pending", role: "kid" }); // Role doesn't matter yet
                return Response.json({ token }, { headers: CORS_HEADERS });
            }
            return Response.json({ error: "Invalid code" }, { status: 401, headers: CORS_HEADERS });
        }

        // --- AUTH: VERIFY TOKEN FOR REQUESTS ---
        const authHeader = req.headers.get("Authorization");
        const token = authHeader?.split(" ")[1];
        const payload = token ? await verifyToken(token) : null;

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
            });

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
                });

                return Response.json({ token: newToken, user: profile }, { headers: CORS_HEADERS });
            }
        }

        // --- API: ADMIN ---
        if (url.pathname.endsWith("/admin/invite") && req.method === "POST") {
            if (payload.role !== "admin") {
                return Response.json({ error: "Forbidden" }, { status: 403, headers: CORS_HEADERS });
            }

            // Generate simple 6-char code
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const invites = await this.room.storage.get<string[]>("invites") || [];
            invites.push(newCode);
            await this.room.storage.put("invites", invites);

            return Response.json({ code: newCode }, { headers: CORS_HEADERS });
        }

        return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
        const token = new URL(conn.uri).searchParams.get("token");

        console.log('🔌 [PartyKit] Connection attempt:', {
            hasToken: !!token,
            tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
        });

        // Verify token properly (Async)
        const payload = token ? await verifyToken(token) : null;

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
