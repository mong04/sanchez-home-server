import PocketBase from 'pocketbase';

// Use the environment variable for the PocketBase URL, defaulting to local dev
const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Initialize the PocketBase client as a singleton
export const pb = new PocketBase(pbUrl);

// Auto-cancellation is enabled by default
pb.autoCancellation(true);
