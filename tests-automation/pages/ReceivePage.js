const BasePage = require('./BasePage');

class ReceivePage extends BasePage {
    get recipientAddress() {
        return $('//div[normalize-space()="ASI Address"]/following-sibling::div[1]');
    }

    async getRecipientAddress() {
        return await this.getText(this.recipientAddress);
    }
}

module.exports = new ReceivePage();
