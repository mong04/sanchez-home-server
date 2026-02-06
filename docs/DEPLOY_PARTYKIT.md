# How to Deploy PartyKit Sync Server

We have migrated to **PartyKit** for reliable, managed synchronization.
This means you have two components to deploy:

1.  **Frontend**: Your Remix/Vite app (Deployed to Vercel).
2.  **Backend**: The PartyKit Server (Deployed to PartyKit Cloud).

## Step 1: Deploy PartyKit Server
1.  Login to PartyKit (if you haven't):
    ```bash
    npx partykit login
    ```
2.  Deploy the server:
    ```bash
    npx partykit deploy
    ```
    *   This will give you a specific URL, e.g., `https://sanchez-family-os-sync.bball.partykit.dev`.

## Step 2: Update Vercel Environment Variables
You DO NOT need to hardcode the URL in the code anymore if you use Environment Variables.
However, our current logic uses a hardcoded fallback in `src/config/sync.ts` for simplicity.

1.  **Copy your new PartyKit URL**.
2.  Open `src/config/sync.ts`.
3.  Paste it into the `PARTYKIT_HOST` field (remove `https://` prefix to keep it clean, if the provider expects host).
    *   *Note: `YPartyKitProvider` usually takes a host like `my-party.user.partykit.dev`.*

```typescript
PARTYKIT_HOST: isDev 
    ? 'localhost:1999' 
    : 'your-new-url.partykit.dev', 
```

4.  **Push your code** to GitHub/Vercel.

## Step 3: Done!
Your app will now connect to this dedicated sync server.
