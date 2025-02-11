# OneClick-WooSetup

## Project Description

This project automates the setup and testing of a WordPress WooCommerce site using Playwright with JavaScript. The automation script will handle tasks such as installation, configuration, and basic functional tests to ensure the WooCommerce plugin is working correctly.

## Requirements

To get started with this project, you need to have the following software installed:

1. **VS Code**: A powerful source-code editor developed by Microsoft.
   - [Download VS Code](https://code.visualstudio.com/)
2. **Node.js**: A JavaScript runtime built on Chrome's V8 JavaScript engine.
   - [Download Node.js](https://nodejs.org/)
3. **Playwright**: A framework for Web Testing and Automation by Microsoft.
   - Install Playwright via npm after setting up Node.js.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   https://github.com/NarendraCodeHub/OneClick-WooSetup.git
   cd OneClick-WooSetup
   ```

2. **Open the Project in VS Code**
   - Launch VS Code.
   - Open the cloned repository folder.

3. **Install Dependencies**
   - Open a terminal in VS Code and run:
     ```bash
     npm install
     ```
   - This will install all required dependencies, including Playwright.

4. **Configure WordPress and WooCommerce**
   - Ensure you have a local or remote WordPress setup.
   - Set up a MySQL database for WordPress.
   - Configure necessary environment variables (such as site URL and credentials) in a `wp_woo_setup.spec.js
` file.

## Running the Tests

1. **Execute Playwright Tests**
   - Run the following command in the terminal:
     ```bash
     npx playwright test
     ```
   - This will execute all test scripts for automating WooCommerce setup and functionality testing.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

