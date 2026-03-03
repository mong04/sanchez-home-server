import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

const token = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImExMjM3MWE5LWJiZTQtNDRkOS1iYzExLTU3OWFhNTVlN2JmMCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3h0aG5qaGNtaWdvaWd3a2t6dGFmLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI5ZWY4N2Q5MC03YmY4LTRjODktYmFmZS02MWJiOWRkM2JiOGIiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzcyNDYzNTMxLCJpYXQiOjE3NzI0NTk5MzEsImVtYWlsIjoiYW5kcmV3c2FuY2hlejEwQGxpdmUuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzI0NTk5MzF9XSwic2Vzc2lvbl9pZCI6IjlhMDE0OGMwLWFmZTEtNDkzMy1iMzliLWQ4NzIyNjAzOGEzNSIsImlzX2Fub255bW91cyI6ZmFsc2V9.VvaGK3zTGid7awHqLkXRtIOSmMKLWETd7ZzsaZEYnORt9yMdwSKBrhPdK7exDOCQkxBYS6LY8cpehaYaKIqYMQ";

async function run() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    console.log("URL:", supabaseUrl);
    console.log("KEY length:", supabasePublishableKey?.length);

    try {
        const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': supabasePublishableKey || '',
            }
        });

        console.log("Status:", response.status);
        if (!response.ok) {
            console.error("Text:", await response.text());
        } else {
            const data = await response.json();
            console.log("Success! ID:", data.id);
        }
    } catch (e) {
        console.error("Fetch failed", e);
    }
}
run();
