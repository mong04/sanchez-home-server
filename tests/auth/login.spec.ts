import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    });

    test('redirects to invite screen when not authenticated', async ({ page }) => {
        await page.goto('/');
        await page.waitForTimeout(1000); // Give it a sec to hydrate

        // Debugging
        if (!await page.locator('text=Sanchez Family OS').isVisible()) {
            console.log("Page content:", await page.content());
            await page.screenshot({ path: 'debug-auth-failure.png' });
        }

        await expect(page.locator('text=Sanchez Family OS')).toBeVisible();
        await expect(page.locator('text=Secure Digital Airlock')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('validates incorrect invite code', async ({ page }) => {
        await page.goto('/');
        await page.fill('input[type="password"]', 'WRONG-CODE');
        await page.click('button[type="submit"]');
        await expect(page.locator('text=Access Denied')).toBeVisible();
    });

    test('successful login and profile setup', async ({ page }) => {
        await page.goto('/');

        // 1. Enter valid code
        // Screenshot 1: Airlock/Invite Screen (well, actually we are past it, let's take one before)
        await page.fill('input[type="password"]', 'SANCHEZ-KIDS-2025');
        await page.click('button[type="submit"]');

        // 2. Profile Selection (New Step)
        await expect(page.locator('text=Who\'s using Sanchez OS?')).toBeVisible({ timeout: 15000 });
        await page.click('text=Add Profile');

        // 3. Profile Setup
        await expect(page.locator('text=Welcome to the Family')).toBeVisible();
        await page.screenshot({ path: '.agent_comms/screenshots/phase10b_auth_proof_2_profile.png' });

        // 4. Fill Profile
        await page.fill('input[placeholder*="Dad, Mom"]', 'Test User');
        await page.click('text=Kid'); // Select role
        await page.click('button:has-text("Enter Sanchez OS")');

        // 5. Verify Dashboard
        // Use visible=true to select the one that is currently shown (Sidebar vs Bottom Nav)
        await expect(page.locator('text=Command Center >> visible=true')).toBeVisible();
        await page.screenshot({ path: '.agent_comms/screenshots/phase10b_auth_proof_3_dashboard.png' });
    });
});
