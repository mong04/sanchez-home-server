import { test, expect } from '@playwright/test';

test.describe('UX Verification Screenshots', () => {
    test.use({ viewport: { width: 1280, height: 720 } }); // Desktop view

    test('capture empty state and feedback modal', async ({ page }) => {
        // Clear IndexedDB to ensure empty state
        await page.goto('/');
        await page.evaluate(async () => {
            const dbs = await window.indexedDB.databases();
            dbs.forEach(db => {
                if (db.name) window.indexedDB.deleteDatabase(db.name);
            });
        });

        // Reload to apply empty state
        await page.reload();

        // 1. Capture Empty State (Family Messenger)
        await page.click('text=Messenger');
        await page.waitForTimeout(1000); // Wait for transition and load
        await page.screenshot({ path: '.agent_comms/screenshots/phase10_ux_polish_proof_1.png' });

        // 2. Capture Feedback Modal
        // Click FAB
        await page.click('button[aria-label="Send Feedback"]');
        await page.waitForSelector('text=Send Feedback'); // Modal title
        await page.waitForTimeout(500); // Wait for animation
        await page.screenshot({ path: '.agent_comms/screenshots/phase10_ux_polish_proof_2.png' });
    });
});
