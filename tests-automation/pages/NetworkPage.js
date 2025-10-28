const BasePage = require('./BasePage');

class NetworkPage extends BasePage {
    get editConfigBtn() {
        return $("//button[contains(., 'Edit Configuration')]");
    }

    get addCustomNetworkBtn() {
        return $("//button[contains(., 'Add Custom Network')]");
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
        return $("//input[contains(@placeholder, 'Enter password')]");
    }

    get showBtn() {
        return $("//button[contains(., 'Show')]");
    }

    get confirmBtn() {
        return $("//button[contains(., 'Confirm')]");
    }

    async viewPrivateKey(password) {
        await this.click(this.viewPrivateKeyBtn);
        await this.setValue(this.passwordInput, password);
        await this.click(this.confirmBtn);
        await this.click(this.showBtn);
    }

    async editNetworkConfig(validatorIP, readonlyIP) {
        await this.click(this.editConfigBtn);
        await this.setValue(this.validatorInput, validatorIP);
        await this.setValue(this.readonlyInput, readonlyIP);
        await this.click(this.saveConfigBtn);
    }

    async configureCustomNetwork({ networkName, networkUrl, readonlyIP}) {
        await this.click(this.addCustomNetworkBtn);
        await this.setValue(this.customNetworkNameInput, networkName);
        await this.setValue(this.customNetworkUrlInput, networkUrl);
        await this.setValue(this.customNetworkReadOnlyUrlInput, readonlyIP);
        await this.click(this.addNetworkBtn);
    }

    async isNetworkAdded(networkName) {
        const networkOption = $(`//select/option[normalize-space()="${networkName}"]`);
        return await networkOption.isExisting();
    }
}

module.exports = new NetworkPage();