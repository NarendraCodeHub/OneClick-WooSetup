import { test, expect } from '@playwright/test';

// Constants for reusable values
const BASE_URL = 'http://127.0.0.1/test-setup';
const DB_NAME = 'test-setup';
const DB_USER = 'root';
const DB_PASSWORD = '';
const SITE_TITLE = 'Test Site';
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_EMAIL = 'admin@gmail.com';
const COUNTRY = 'India — Uttar Pradesh';
const ZONE_NAME = 'worldwide';

test('WordPress setup with WooCommerce and WP Mail plugin', async ({ page }) => {
    // Set global timeout to 60 seconds
    test.setTimeout(90000);

    try {
        // Navigate to WordPress setup page
        await page.goto(BASE_URL, { waitUntil: 'load' });
        await page.getByRole('button', { name: 'Continue' }).click();
        await page.getByRole('link', { name: 'Let’s go!' }).click();

        // Database setup
        await fillDatabaseDetails(page, DB_NAME, DB_USER, DB_PASSWORD);
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.getByRole('link', { name: 'Run the installation' }).click();

        // Fill site details
        await fillSiteDetails(page, SITE_TITLE, ADMIN_USER, ADMIN_PASSWORD, ADMIN_EMAIL);
        await page.locator("//input[@class='button button-large']").click();

        // Login to WordPress
        await loginToWordPress(page, ADMIN_USER, ADMIN_PASSWORD);

        // Install and activate WP Mail plugin
        await installAndActivatePlugin(page, 'WP Mail Logging', 'WP Mail Logging', 'wp-mail-logging');

        // Install and activate WooCommerce plugin
        await installAndActivatePlugin(page, 'woocommerce', 'WooCommerce', 'woocommerce');

        // Configure WooCommerce
        await configureWooCommerce(page, COUNTRY, ZONE_NAME);

        // Configure WordPress settings
        await configureWordPressSettings(page);

        // Install and activate Storefront theme
        await installAndActivateTheme(page, 'storefront');

        // Logout
        await page.getByRole('menuitem', { name: 'Howdy, admin' }).click();
    } catch (error) {
        console.error('Test failed:', error);
        throw error; // Re-throw the error to fail the test
    }
});

// Helper functions
async function fillDatabaseDetails(page, dbName, dbUser, dbPassword) {
    await page.getByRole('textbox', { name: 'Database Name' }).fill(dbName);
    await page.getByRole('textbox', { name: 'Username' }).fill(dbUser);
    await page.getByRole('textbox', { name: 'Password' }).fill(dbPassword);
}

async function fillSiteDetails(page, siteTitle, adminUser, adminPassword, adminEmail) {
    await page.getByRole('textbox', { name: 'Site Title' }).fill(siteTitle);
    await page.getByRole('textbox', { name: 'Username' }).fill(adminUser);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(adminPassword);
    //await page.getByRole('textbox', { name: 'Repeat Password (required)' }).fill(adminPassword);
    await page.getByRole('checkbox', { name: 'Confirm use of weak password' }).check();
    await page.getByRole('textbox', { name: 'Your Email' }).fill(adminEmail);
}

async function loginToWordPress(page, username, password) {
    await page.getByRole('link', { name: 'Log In' }).click();
    await page.getByRole('textbox', { name: 'Username or Email Address' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
}

async function installAndActivatePlugin(page, pluginName, pluginTitle, pluginSlug) {
    try {
        await page.getByRole('link', { name: 'Plugins', exact: true }).click();
        await page.waitForSelector('text=Add New Plugin', { state: 'visible', timeout: 60000 });

        // Use a more specific locator to avoid ambiguity
        await page.locator('#wpbody-content').getByRole('link', { name: 'Add New Plugin' }).click();
        await page.waitForLoadState('networkidle', { timeout: 60000 });

        console.log('Searching for plugin:', pluginName);
        await page.getByRole('searchbox', { name: 'Search Plugins' }).fill(pluginName);
        await page.getByRole('searchbox', { name: 'Search Plugins' }).press('Enter');

        // Wait for search results to load
        console.log('Waiting for search results...');
        await page.waitForSelector('.plugin-card', { state: 'visible', timeout: 60000 });

        // Check if the plugin is found
        const pluginCard = await page.$('.plugin-card');
        if (!pluginCard) {
            throw new Error(`Plugin "${pluginName}" not found in search results.`);
        }

        // Wait for the install button to be visible using data-slug
        console.log('Waiting for install button...');
        const installButtonSelector = `a.install-now.button[data-slug="${pluginSlug}"]`;
        await page.waitForSelector(installButtonSelector, { state: 'visible', timeout: 90000 });
        await page.click(installButtonSelector);

        // Wait for the activate button to be visible
        console.log('Waiting for activate button...');
        const activateButtonSelector = `button:has-text("Activate ${pluginTitle}")`;
        await page.waitForSelector(activateButtonSelector, { state: 'visible', timeout: 90000 });
        await page.getByRole('button', { name: `Activate ${pluginTitle}` }).click();
    } catch (error) {
        console.error(`Error installing/activating plugin ${pluginTitle}:`, error);
        throw error;
    }
}

async function configureWooCommerce(page, country, zoneName) {
    await page.getByRole('button', { name: 'Skip guided setup' }).click();
    await page.getByRole('combobox', { name: 'Select country/region' }).fill(country);
    await page.getByRole('option', { name: country }).click();
    await page.getByRole('button', { name: 'Go to my store' }).click();

    await page.locator('#toplevel_page_woocommerce').getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Site visibility' }).click();
    await page.getByRole('radio', { name: 'Live' }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();

    await page.getByRole('link', { name: 'Accounts & Privacy' }).click();
    await page.getByRole('checkbox', { name: 'On "My account" page' }).check();
    await page.getByRole('checkbox', { name: 'Send password setup link (' }).uncheck();
    await page.getByRole('button', { name: 'Save changes' }).click();

    await page.getByRole('link', { name: 'Shipping' }).click();
    await page.getByRole('link', { name: 'Add zone' }).click();
    await page.getByRole('textbox', { name: 'Zone name' }).fill(zoneName);
    await page.getByRole('button', { name: 'Add shipping method' }).click();
    await page.getByText('Free shipping', { exact: true }).click();
    await page.getByRole('button', { name: 'Create and save' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
}

async function configureWordPressSettings(page) {
    await page.locator('#menu-settings').getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Permalinks' }).click();
    await page.getByRole('radio', { name: 'Post name' }).check();
    await page.getByRole('button', { name: 'Save Changes' }).click();
}

async function installAndActivateTheme(page, themeName) {
    await page.getByRole('link', { name: 'Appearance' }).click();
    await page.getByRole('link', { name: 'Add New Theme', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search Themes' }).fill(themeName);
    await page.getByRole('link', { name: `Install ${themeName}`, exact: true }).click();
    await page.getByRole('link', { name: `Activate ${themeName}` }).click();
}