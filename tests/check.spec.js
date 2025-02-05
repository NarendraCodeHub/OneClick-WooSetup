import { test, expect } from '@playwright/test';
const BASE_URL = 'http://127.0.0.1/test-setup/wp-admin/admin.php?page=wc-settings&tab=general';
const taxFilePath = 'sample-data/sample_tax_rates.csv';
const productFilePath = 'sample-data/sample_products.csv';
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin';


test('WordPress', async ({ page }) => {
    // Set global timeout to 60 seconds
test.setTimeout(50000);
 await page.goto(BASE_URL, { waitUntil: 'load' });

 await loginToWordPress(page, ADMIN_USER, ADMIN_PASSWORD);

    await configureWooCommerce(page, taxFilePath);

    // Import Products 
    await importProducts(page, productFilePath)

    // Configure WordPress settings
    await configureWordPressSettings(page);

    // Install and activate Storefront theme
    await installAndActivateTheme(page, 'storefront');

    // Logout
    await logout(page);

});

async function loginToWordPress(page, username, password) {
    await page.getByRole('textbox', { name: 'Username or Email Address' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
}

async function configureWooCommerce(page, taxFilePath) {
   
    // Navigate to General section
    await page.getByRole('checkbox', { name: 'Enable tax rates and' }).check();
    await page.getByRole('button', { name: 'Save changes' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
        page.getByRole('paragraph').filter({ hasText: 'Your settings have been saved.' })
    ).toBeVisible();

    // Navigate to Tax section
    await page.getByRole('link', { name: 'Tax', exact: true }).click();
    await page.getByRole('link', { name: 'Standard rates' }).click();
    await page.getByRole('heading', { name: 'Standard tax rates' }).waitFor({ state: 'visible', timeout: 2000 });
    await page.getByRole('link', { name: 'Import CSV' }).click();
    await page.getByRole('heading', { name: 'Import tax rates' }).waitFor({ state: 'visible', timeout: 2000 });
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

