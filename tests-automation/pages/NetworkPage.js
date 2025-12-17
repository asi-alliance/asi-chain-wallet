const BasePage = require('./BasePage');

class NetworkPage extends BasePage {
    get editConfigBtn() {
        return $("//button[contains(., 'Edit Configuration')]");
    }

    get saveCustomNetworkBtn() {
        return $("//button[contains(., 'Save Custom Network')]");
    }

    get customNetworkNameInput() {
        return $("//input[@placeholder='My Custom Network']");
    }

    get customNetworkUrlInput() {
        return $("//input[@placeholder='https://my-validator.example.com:443']");
    }

    get customNetworkReadOnlyUrlInput() {
        return $("//input[@placeholder='https://my-readonly.example.com:443']");
    }

    get addNetworkBtn() {
        return $("//button[contains(., 'Add Network')]");
    }

    get validatorInput() {
        return $("#network-validator-host-input");
    }

    get readonlyIP() {
        return $("#network-readonly-host-input");
    }

    get saveConfigBtn() {
        return $("//button[contains(., 'Save Configuration')]");
    }

    get viewPrivateKeyBtn() {
        return $("//button[contains(., 'View Private Key')]");
    }

    get passwordInput() {
        return $("/html/body/div/div[1]/main/div/div[3]/div/div[1]/input");
    }

    get showBtn() {
        return $("//button[contains(., 'Show')]");
    }

    get confirmBtn() {
        return $("//button[contains(., 'Confirm')]");
    }

    async viewPrivateKey(password) {
        await this.click(this.viewPrivateKeyBtn);
        await browser.pause(1500);
        await this.passwordInput.waitForDisplayed({ timeout: 15000 });
        await browser.pause(1500);
        await this.passwordInput.click();
        await this.setValue(this.passwordInput, password);
        await browser.pause(500);
        await this.click(this.confirmBtn);
        await browser.pause(500);
        await this.click(this.showBtn);
    }

    async editNetworkConfig(validatorIP, readonlyIP) {
        await this.click(this.editConfigBtn);
        await this.setValue(this.validatorInput, validatorIP);
        await this.setValue(this.readonlyInput, readonlyIP);
        await this.click(this.saveConfigBtn);
    }

    async configureCustomNetwork() {
        await this.click(this.saveCustomNetworkBtn);
    }

    async isNetworkAdded(networkName) {
        const networkOption = $(`//select/option[normalize-space()="${networkName}"]`);
        return await networkOption.isExisting();
    }
}

module.exports = new NetworkPage();