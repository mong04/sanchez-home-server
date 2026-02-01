import { test, expect, devices } from '@playwright/test';

test.describe('Multi-Device Sync', () => {
    test('Shopping List items sync between Phone and Tablet', async ({ browser }) => {
        // Creating two isolated browser contexts
        const phoneContext = await browser.newContext({
            ...devices['Pixel 5'],
        });
        const tabletContext = await browser.newContext({
            ...devices['iPad (gen 7)'],
        });

        const phonePage = await phoneContext.newPage();
        const tabletPage = await tabletContext.newPage();

        // Helper to navigate to Shopping List
        const navigateToShoppingList = async (page: any) => {
            await page.goto('/');
            // Click main nav "Organizer"
            await page.getByRole('button', { name: /Organizer/i }).click();
            // Click sub-tab "Shopping"
            await page.getByRole('tab', { name: /Shopping/i }).click();
            // Wait for input
            await expect(page.getByPlaceholder('Add item (e.g. Milk)')).toBeVisible({ timeout: 10000 });
        };

        // 1. Navigate both devices to the app and correct tab
        await Promise.all([
            navigateToShoppingList(phonePage),
            navigateToShoppingList(tabletPage),
        ]);

        const itemText = `Buy Milk ${Date.now()}`;

        // 2. Phone adds an item
        const shoppingInputPhone = phonePage.getByPlaceholder('Add item (e.g. Milk)');

        await shoppingInputPhone.fill(itemText);
        await shoppingInputPhone.press('Enter');

        // 3. Tablet waits for the item
        const tabletItem = tabletPage.getByText(itemText);
        await expect(tabletItem).toBeVisible({ timeout: 5000 });

        // 4. Tablet checks the checkbox
        // Finding the checkbox associated with the text
        const tabletCheckbox = tabletPage.locator('div').filter({ hasText: itemText }).getByRole('checkbox');
        await expect(tabletCheckbox).toBeVisible();
        await tabletCheckbox.check();

        // 5. Phone verifies the item is checked
        const phoneCheckbox = phonePage.locator('div').filter({ hasText: itemText }).getByRole('checkbox');
        await expect(phoneCheckbox).toBeChecked();

        // Cleanup contexts
        await phoneContext.close();
        await tabletContext.close();
    });
});
