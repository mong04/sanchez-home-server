import { test, expect } from '@playwright/test';

test.describe('UX: Touch Targets', () => {
    test('all interactive elements should meet minimum touch target size (44x44px)', async ({ page }) => {
        // Go to the home page (adjust if login is needed, assuming default dev state is accessible or mocked)
        await page.goto('/');

        // Get all buttons and anchor tags
        // We might need to handle specific containers if the app is large, but scanning 's roots is a good start.
        // Also consider inputs, etc.
        const interactiveElements = await page.locator('button, a, input[type="button"], input[type="submit"], [role="button"]');

        const count = await interactiveElements.count();
        console.log(`Found ${count} interactive elements to check.`);

        const violations: string[] = [];

        for (let i = 0; i < count; i++) {
            const element = interactiveElements.nth(i);

            // Check if visible
            if (!(await element.isVisible())) continue;

            const box = await element.boundingBox();
            if (!box) continue;

            // Check dimensions
            // Apple HIG: 44x44pt
            // WCAG 2.5.5: 44x44 CSS pixels (AAA level, but good for "Mobile First")
            const width = box.width;
            const height = box.height;

            if (width < 44 || height < 44) {
                // Get some identifier for the error message
                const outerHTML = await element.evaluate(el => el.outerHTML.substring(0, 100)); // First 100 chars
                violations.push(`Element too small: ${width.toFixed(1)}x${height.toFixed(1)}px. Element: ${outerHTML}`);
            }
        }

        if (violations.length > 0) {
            console.error('Touch target violations found:', violations);
        }

        expect(violations, `Found ${violations.length} touch target violations`).toEqual([]);
    });
});
