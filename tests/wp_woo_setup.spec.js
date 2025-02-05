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
const taxFilePath = 'sample-data/sample_tax_rates.csv';
const productFilePath = 'sample-data/sample_products.csv';



test('WordPress setup with WooCommerce and WP Mail plugin', async ({ page }) => {
    // Set global timeout to 60 seconds
    test.setTimeout(500000);

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
        await configureWooCommerce(page, COUNTRY, ZONE_NAME, taxFilePath);

        // Import Products 
        await importProducts(page, productFilePath)

        // Configure WordPress settings
        await configureWordPressSettings(page);

        // Install and activate Storefront theme
        await installAndActivateTheme(page, 'storefront');

        // Logout
        await logout(page);
    } catch (error) {
        console.error('Test failed:', error);
        throw error; 
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
    await page.getByRole('textbox', { name: 'Password', exact: true }).clear();
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
        // Check if we are already on the Plugins page
        const isPluginsPage = await page.locator('h1').filter({ hasText: 'Plugins' }).count();

        if (!isPluginsPage) {
            console.log('Navigating to Plugins page...');
            await page.waitForTimeout(1000);
            await page.getByRole('link', { name: 'Plugins', exact: true }).click();
            await page.getByRole('heading', { name: 'Plugins', exact: true }).waitFor({ state: 'visible', timeout: 120000 });
        } else {
            console.log('Already on the Plugins page, skipping navigation.');
        }

        // Click on "Add New Plugin"
        await page.locator('#wpbody-content').getByRole('link', { name: 'Add New Plugin' }).click();
        await page.waitForLoadState('networkidle', { timeout: 270000 });

        // Search for the plugin
        console.log(`Searching for plugin: ${pluginName}`);
        await page.getByRole('searchbox', { name: 'Search Plugins' }).fill(pluginName);
        await page.getByRole('searchbox', { name: 'Search Plugins' }).press('Enter');

        // Wait for search results
        console.log('Waiting for search results...');
        await page.waitForSelector('.plugin-card', { state: 'visible', timeout: 500000 });

        // Check if the plugin is found
        const pluginCard = await page.$('.plugin-card');
        if (!pluginCard) {
            throw new Error(`Plugin "${pluginName}" not found in search results.`);
        }

        // Install the plugin
        console.log('Waiting for "Install Now" button...');
        const installButtonSelector = `a.install-now.button[data-slug="${pluginSlug}"]`;
        await page.waitForSelector(installButtonSelector, { state: 'visible', timeout: 500000 });
        await page.click(installButtonSelector);

        // Wait for installation
        console.log('Waiting for installation to complete...');
        const installingSelector = `a.updating-message[data-slug="${pluginSlug}"]`;
        await page.waitForSelector(installingSelector, { state: 'visible', timeout: 500000 });
        await page.waitForSelector(installingSelector, { state: 'hidden', timeout: 500000 });

        // Activate the plugin
        console.log('Waiting for "Activate" button...');
        const activateButtonSelector = `a.button.activate-now[data-slug="${pluginSlug}"]`;
        await page.waitForSelector(activateButtonSelector, { state: 'visible', timeout: 500000 });
        await page.click(activateButtonSelector);

        // Handle redirection
        console.log('Waiting for redirection after activation...');
        if (pluginSlug === 'woocommerce') {
            await page.waitForSelector('text=Welcome to Woo!', { state: 'visible', timeout: 500000 });
        } else {
            await page.getByRole('heading', { name: 'Plugins', exact: true }).waitFor({ state: 'visible', timeout: 120000 });
        }

        console.log(`Plugin "${pluginTitle}" installed and activated successfully.`);
    } catch (error) {
        console.error(`Error installing/activating plugin ${pluginTitle}:`, error);
        throw error;
    }
}

async function configureWooCommerce(page, country, zoneName, taxFilePath) {
    await page.getByRole('button', { name: 'Skip guided setup' }).click();
    await page.getByRole('combobox', { name: 'Select country/region' }).fill(country);
    await page.getByRole('option', { name: country }).click();
    await page.getByRole('button', { name: 'Go to my store' }).click();

    await page.locator('#toplevel_page_woocommerce').getByRole('link', { name: 'Settings' }).click();

    // Navigate to Site Visibility Section
    await page.getByRole('link', { name: 'Site visibility' }).click();
    await page.getByRole('radio', { name: 'Live' }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Navigate to Account & Privacy section
    await page.getByRole('link', { name: 'Accounts & Privacy' }).click();
    await page.getByRole('checkbox', { name: 'Enable log-in during checkout' }).check();
    await page.getByRole('checkbox', { name: 'During checkout', exact: true }).check();
    await page.getByRole('checkbox', { name: 'On "My account" page' }).check();
    await page.getByRole('checkbox', { name: 'Send password setup link (' }).uncheck();
    await page.getByRole('button', { name: 'Save changes' }).click();

    // Navigate to General section
    await page.locator('#mainform').getByRole('link', { name: 'General' }).click();
    await page.getByRole('checkbox', { name: 'Enable tax rates and' }).check();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
        page.getByRole('paragraph').filter({ hasText: 'Your settings have been saved.' })
    ).toBeVisible();

    // Navigate to Tax section
    await page.getByRole('link', { name: 'Tax', exact: true }).click();
    await page.getByRole('link', { name: 'Standard rates' }).click();
    await page.getByRole('heading', { name: 'Standard tax rates' }).waitFor({ state: 'visible', timeout: 2000 });
    await page.getByRole('link', { name: 'Import CSV' }).click();
    await page.getByRole('heading', { name: 'Import tax rates' }).waitFor({ state: 'visible', timeout: 2000});
    await page.getByRole('textbox', { name: 'Choose a file from your' }).setInputFiles(taxFilePath);
    await page.getByRole('button', { name: 'Upload file and import' }).click();
    await page.getByText('All done! View tax rates').waitFor({ state: 'visible', timeout: 2000 });
    await page.getByRole('link', { name: 'View tax rates' }).click();

    // Navigate to Payments section
    await page.getByRole('link', { name: 'Payments', exact: true }).click();
    await page.getByRole('heading', { name: 'Payment Methods' }).waitFor({ state: 'visible', timeout: 2000 });

    // Function to enable a payment method and verify it
    async function enablePaymentMethod(disabledText, enabledText) {
        const disabledLocator = page.getByRole('link', { name: disabledText });
        const enabledLocator = page.getByRole('link', { name: enabledText });

        await disabledLocator.waitFor({ state: 'visible', timeout: 5000 });
        await disabledLocator.click();

        await page.reload(); 

        await enabledLocator.waitFor({ state: 'visible', timeout: 5000 });
        await expect(enabledLocator).toBeVisible();
    }

    // Enable and verify payment methods
    await enablePaymentMethod(
        'The "Direct bank transfer" payment method is currently disabled',
        'The "Direct bank transfer" payment method is currently enabled'
    );

    await enablePaymentMethod(
        'The "Check payments" payment method is currently disabled',
        'The "Check payments" payment method is currently enabled'
    );

    await enablePaymentMethod(
        'The "Cash on delivery" payment method is currently disabled',
        'The "Cash on delivery" payment method is currently enabled'
    );

    // Navigate to Shipping Section
    await page.getByRole('link', { name: 'Shipping' }).click();
    await page.getByRole('link', { name: 'Add zone' }).click();
    await page.getByRole('textbox', { name: 'Zone name' }).fill(zoneName);
    await page.getByRole('button', { name: 'Add shipping method' }).click();
    await page.getByText('Free shipping', { exact: true }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create and save' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
}

async function importProducts(page, productFilePath) {
    // Navigate to Products section
    await page.locator('#menu-posts-product').getByRole('link', { name: 'Products', exact: true }).click();
    await page.locator('#wpbody-content').getByRole('heading', { name: 'Products', exact: true }).waitFor({ state: 'visible', timeout: 3000 });

    // Start Import Process
    await page.getByRole('link', { name: 'Start Import' }).click();
    await page.getByRole('heading', { name: 'Import products from a CSV' }).waitFor({ state: 'visible', timeout: 3000 });

    // Upload Sample CSV File
    await page.getByRole('textbox', { name: 'Choose a CSV file from your' }).setInputFiles(productFilePath);

    // Continue to Mapping Fields
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('heading', { name: 'Map CSV fields to products' }).waitFor({ state: 'visible', timeout: 5000 });

    // Run Importer
    await page.getByRole('button', { name: 'Run the importer' }).click();
    await page.getByRole('heading', { name: 'Importing' }).waitFor({ state: 'visible', timeout: 10000 });

    // Wait for "View Products" link and Click
    await page.getByRole('link', { name: 'View products' }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByRole('link', { name: 'View products' }).click();

    // Validate Products Page
    await page.locator('#wpbody-content').getByRole('heading', { name: 'Products', exact: true }).waitFor({ state: 'visible', timeout: 5000 });
}

// Navigate to Wordpress Settings
async function configureWordPressSettings(page) {
    await page.locator('#menu-settings').getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Permalinks' }).click();
    await page.getByRole('radio', { name: 'Post name' }).check();
    await page.getByRole('button', { name: 'Save Changes' }).click();
}

// Navigate to Theme 
async function installAndActivateTheme(page, themeName) {
    await page.getByRole('link', { name: 'Appearance' }).click();
    await page.getByRole('link', { name: 'Add New Theme', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search Themes' }).fill(themeName);
    await page.getByRole('heading', { name: themeName, exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('link', { name: `Install ${themeName}` }).click();
    await page.getByRole('link', { name: `Installing ${themeName}...` }).waitFor({ state: 'visible', timeout: 10000 });
    await page.getByRole('link', { name: `Activate ${themeName}` }).click();
    await page.getByRole('heading', { name: 'Themes' }).waitFor({ state: 'visible', timeout: 5000 });
}

// Admin Logout
async function logout(page) {
    await page.getByRole('menuitem', { name: 'Howdy, admin' }).click();
    await page.getByRole('menuitem', { name: 'Log Out' }).click();
    await page.getByText('You are now logged out.').waitFor({ state: 'visible', timeout: 5000 });
}
