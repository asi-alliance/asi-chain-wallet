const BasePage = require('./BasePage');

class NavbarPage extends BasePage {
    get hamburgerMenuBtn() {
        return $("#sidebar-menu-button");
    }

    get dashboardBtn() {
        return $("//button[contains(., 'Dashboard')]");
    }

    get sendBtn() {
        return $("//button[contains(., 'Send')]");
    }

    get accountsBtn() {
        return $("//button[contains(., 'Accounts')]");
    }

    get receiveBtn() {
        return $("//button[contains(., 'Receive')]");
    }

    get ideBtn() {
        return $("//button[contains(., 'IDE')]");
    }

    get historyBtn() {
        return $("//button[contains(., 'History')]");
    }

    get deployBtn() {
        return $("//button[contains(., 'Deploy')]");
    }

    get settingsBtn() {
        return $("//button[contains(., 'Settings')]");
    }

    get generateKeysBtn() {
        return $("//button[contains(., 'Generate Keys')]");
    }

    async navigateToGenerateKeys() {
        await this.openNavBarIfMobile();
        await this.click(this.generateKeysBtn);
    }

    async openNavBarIfMobile() {
        if (await this.isMobile()) {
            await this.click(this.hamburgerMenuBtn);
        }
    }

    async navigateToDashboard() {
        await this.openNavBarIfMobile();
        await this.click(this.dashboardBtn);
    }

    async navigateToAccounts() {
        await this.openNavBarIfMobile();
        await this.click(this.accountsBtn);
    }

    async navigateToIDE() {
        await this.openNavBarIfMobile();
        await this.click(this.ideBtn);
    }
    
    async navigateToSend() {
        await this.openNavBarIfMobile();
        await this.click(this.sendBtn);
    }

    async navigateToReceive() {
        await this.openNavBarIfMobile();
        await this.click(this.receiveBtn);
    }

    async navigateToHistory() {
        await this.openNavBarIfMobile();
        await this.click(this.historyBtn);
    }

    async navigateToDeploy() {
        await this.openNavBarIfMobile();
        await this.click(this.deployBtn);
    }

    async navigateToSettings() {
        await this.openNavBarIfMobile();
        await this.click(this.settingsBtn);
    }

    async isSettingsPageDisplayed() {
        return await $("//h3[contains(., 'Network Settings')]").isDisplayed() &&
               await $("//h3[contains(., 'Predefined Networks')]").isDisplayed();
    }
}

module.exports = new NavbarPage();