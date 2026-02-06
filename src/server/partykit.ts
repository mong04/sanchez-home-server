import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

export default class Server implements Party.Server {
    room: Party.Room;
    constructor(room: Party.Room) {
        this.room = room;
    }

    onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
        // A PartyKit room is a Yjs document.
        // simpler than y-webrtc signaling, this IS the server.
        return onConnect(conn, this.room, {
            // experimental: persist to partykit storage
            persist: true
        });
    }
}
