# How to Deploy Your Own Signaling Server (The "Phone Book")

If the free public signaling servers are flaky (connection errors), the best solution is to host your own. It is free/cheap and takes ~5 minutes.

## Option 1: One-Click Deploy on Glitch (Easiest)
Glitch is a playground for web apps. You can run a free signaling server there.

1.  **Click this link to Remix**: [https://glitch.com/~y-webrtc-signaling](https://glitch.com/edit/#!/y-webrtc-signaling) (Official Yjs demo)
2.  Click **"Remix Your Own"** (top right).
3.  Wait for it to start.
4.  Click **"Share"** -> **"Live Site"** and copy the URL (e.g., `https://my-cool-signal.glitch.me`).
5.  **Update your config**:
    *   Change the protocol from `https://` to `wss://`.
    *   Example: `wss://my-cool-signal.glitch.me`
    *   Add this to your `src/config/sync.ts` list.

## Option 2: Run via Docker (For VPS/Home Lab users)
If you have a server running Docker:

```bash
docker run -d -p 4444:4444 --name y-webrtc-signaling yjs/y-webrtc-signaling
```
Your URL will be `ws://your-server-ip:4444`. Note: For Vercel (HTTPS), you will need to put this behind a reverse proxy with SSL (Nginx/Caddy) to get `wss://`.

## Usage
Once you have your URL (e.g., `wss://my-cool-signal.glitch.me`), add it to the top of your `SIGNALING_URLS` list in `src/config/sync.ts`.

```typescript
SIGNALING_URLS: isDev 
    ? ['ws://localhost:4444'] 
    : [
        'wss://my-cool-signal.glitch.me', // <--- Your private server first!
        'wss://signaling.yjs.dev', 
        ...
      ],
```
