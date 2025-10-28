const BasePage = require('./BasePage');

class AccountsPage extends BasePage {
    get createAccountBtn() {
        return $("#create-account-button");
    }

    get importAccountNameInput() {
        return $("#import-account-name-input");
    }

    get privateKeyInput() {
        return $("#import-account-value-input");
    }

    get importAccountBtn() {
        return $("#import-account-button");
    }

    get accountNameInput() {
        return $("#create-account-name-input");
    }

    get passwordInput() {
        return $("#password-setup-password-input");
    }

    get confirmPasswordInput() {
        return $("#password-setup-confirm-input");
    }

    get continueBtn() {
        return $("#password-setup-submit-button");   
    }

    get refreshBtn() {
        return $('//button[normalize-space()="Refresh Balances"]');
    }

    get dashboardBtn() {
        return $("//button[contains(., 'Dashboard')]");
    }

    get showBtn() {
        return $("//button[contains(., 'Show')]");
    }

    get copyPrivateKeyBtn() {
        return $("//button[contains(., 'Copy Private Key')]");
    }

    get savedPrivateKey() {
        return $("//button[contains(., 've Saved My Private Key')]");
    }

    getImportedAccountHeader(accountName) {
        return $(`//h3[contains(., '${accountName}')]`);
    }

    get accountsListHeader_1() {
        return $("//h2[contains(.,'Your Accounts (1)')]");
    }

    get accountsListHeader_2() {
        return $("//h2[contains(.,'Your Accounts (2)')]");
    }

    get currentBalance(){
        return $("#dashboard-current-balance");
    }

    get refreshBalanceBtn(){
        return $('//button[contains(.,"Refresh Balances")]');
    }

    async getBalance() {
        return await this.currentBalance.getText();
    }

    

    async createAccount(accountName, password) {
        await this.setValue(this.accountNameInput, accountName);
        await this.click(this.createAccountBtn);
        await this.setValue(this.passwordInput, password);
        await this.setValue(this.confirmPasswordInput, password);
        await this.click(this.continueBtn);
        await this.click(this.showBtn);
        await this.click(this.copyPrivateKeyBtn);
        await this.click(this.savedPrivateKey);
    }

    async createAccountWithCatchingPrivateKey(accountName, password) {
        await this.setValue(this.accountNameInput, accountName);
        await this.click(this.createAccountBtn);
        await this.setValue(this.passwordInput, password);
        await this.setValue(this.confirmPasswordInput, password);
        await this.click(this.continueBtn);
        await this.click(this.showBtn);
        const privateKeyEl = await $(`//button[normalize-space(.)="Hide"]/preceding-sibling::div`);
        const privateKey = await privateKeyEl.getText();
        console.log('Private Key:', privateKey);
        await this.click(this.copyPrivateKeyBtn);
        await this.click(this.savedPrivateKey);
    
        return privateKey;
    }

    async importAccount(accountName, privateKey, password) {
        await this.importAccountNameInput.click();
        await this.setValue(this.importAccountNameInput, accountName);
        await this.privateKeyInput.click();
        await this.setValue(this.privateKeyInput, privateKey);
        await this.click(this.importAccountBtn);
        await this.passwordInput.click();
        await this.setValue(this.passwordInput, password);
        await this.confirmPasswordInput.click();
        await this.setValue(this.confirmPasswordInput, password);
        await this.click(this.continueBtn);
    }

    async waitForBalanceUpdate(accountName, initialBalance, amount, timeout = 6000000) {
        const start = Date.now();
    
        while (Date.now() - start < timeout) {
            const refreshBtn = await this.refreshBalanceBtn;
            if (await refreshBtn.isDisplayed()) {
                console.log('Clicking "Refresh Balances" button...');
                await refreshBtn.click();
            } else {
                console.warn('⚠️ "Refresh Balances" button not found, skipping click.');
            }
            await browser.pause(5000);
            const balanceEl = await $(`//h3[normalize-space()="${accountName}"]/following-sibling::div[contains(normalize-space(),"ASI")]`);
            await balanceEl.waitForDisplayed({ timeout: 20000 });
            const text = await balanceEl.getText();
            const current = parseFloat(text.match(/([0-9]*\.?[0-9]+)/)?.[1] || '0');
            console.log(`Current balance: ${current} ASI (initial: ${initialBalance})`);
            if (current <= initialBalance - parseFloat(amount)) {
                console.log('✅ Balance updated successfully.');
                return true;
            }
    
            console.log('⏸ Waiting 3s before next balance check...');
            await browser.getTitle();
            await browser.pause(3000);
        }
    
        console.error('❌ Timeout waiting for balance update.');
        return false;
    }

    async waitForReceiverBalance(accountName, minAmount, timeout = 300000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            await browser.refresh();
            await browser.pause(5000);

            const el = await $(`//h3[normalize-space()="${accountName}"]/following-sibling::div[contains(normalize-space(),"ASI")]`);
            const text = await el.getText();
            const current = parseFloat(text.match(/([0-9]*\.?[0-9]+)/)?.[1] || '0');
            if (current >= parseFloat(minAmount)) return true;

            await browser.pause(20000);
        }
        return false;
    }
}

module.exports = new AccountsPage();