import { test, expect } from '@playwright/test';

test.describe('Privacy & Security Audit', () => {
    test('Network: Should NOT contact unauthorized external domains', async ({ page }) => {
        const allowedDomains = [
            'localhost',
            '127.0.0.1',
            'signaling.yjs.dev',
            'fonts.googleapis.com',
            'fonts.gstatic.com',
        ];

        const unauthorizedDomains = [
            'google-analytics.com',
            'facebook.com',
            'sentry.io',
            'doubleclick.net'
        ];

        const requestLog: string[] = [];

        // Intercept all requests
        await page.route('**', (route) => {
            const url = new URL(route.request().url());
            const hostname = url.hostname;
            requestLog.push(hostname);

            const isAllowed = allowedDomains.some(domain =>
                hostname === domain || hostname.endsWith('.' + domain)
            );

            if (!isAllowed) {
                console.error(`🚨 BLOCKED Unauthorized Request: ${hostname}`);
                // route.abort(); // Optional: abort to enforce strictly
            }

            route.continue();
        });

        // Navigate to the app
        await page.goto('/');

        // Wait for app to load and sync (approximate)
        await page.waitForTimeout(3000);

        // Assert no unauthorized domains
        const unauthorizedRequests = requestLog.filter(host =>
            !allowedDomains.some(allowed => host === allowed || host.endsWith('.' + allowed))
        );

        if (unauthorizedRequests.length > 0) {
            console.log('Unauthorized Requests:', unauthorizedRequests);
        }

        expect(unauthorizedRequests, `Found unauthorized requests to: ${unauthorizedRequests.join(', ')}`).toHaveLength(0);

        // Specific check for trackers
        const trackerRequests = requestLog.filter(host =>
            unauthorizedDomains.some(tracker => host.includes(tracker))
        );
        expect(trackerRequests).toHaveLength(0);
    });
});
