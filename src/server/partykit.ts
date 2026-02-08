import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import { validateToken } from "./auth";

export default class Server implements Party.Server {
    room: Party.Room;
    constructor(room: Party.Room) {
        this.room = room;
    }

    onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
        const token = new URL(conn.request.url).searchParams.get("token");

        if (!validateToken(token)) {
            return new Response("Unauthorized", { status: 401 });
        }

        // A PartyKit room is a Yjs document.
        // simpler than y-webrtc signaling, this IS the server.
        return onConnect(conn, this.room, {
            // experimental: persist to partykit storage
            persist: true
        });
    }
}
