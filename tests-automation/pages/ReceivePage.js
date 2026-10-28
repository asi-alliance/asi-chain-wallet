const BasePage = require('./BasePage');

class ReceivePage extends BasePage {
    get recipientAddress() {
        return $('//*[@id="receive-address-label"]/following-sibling::*[1]');
    }

    async getRecipientAddress() {
        return await this.getText(this.recipientAddress);
    }
}

module.exports = new ReceivePage();
