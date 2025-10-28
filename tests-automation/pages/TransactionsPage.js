const BasePage = require('./BasePage');

class TransactionsPage extends BasePage {
    get recipientAddressInput() {
        return $('#send-recipient-input');
    }

    get amountInput() {
        return $('#send-amount-input');
    }

    get sendBtn() {
        return $('#send-transaction-button');
    }

    get sendPasswordInput() {
        return $("#send-password-input");
    }

    get sendPasswordInput2() {
        return $('//p[contains(text(), "Please review the transaction details before sending.")]/following::input[@type="password"][1]');
    }

    get confirmSendBtn() {
        return $('//button[normalize-space()="Confirm & Send"]');
    }

    get sentMsg() {
        return $('//*[contains(text(),"Transaction sent!")]');
    }

    async sendTransaction(address, amount, password) {
        await this.setValue(this.recipientAddressInput, address);
        await this.setValue(this.amountInput, amount);
        await this.setValue(this.sendPasswordInput, password);
        await this.click(this.sendBtn);
        await this.setValue(this.sendPasswordInput2, password);
        await this.click(this.confirmSendBtn);
    }

    async isTransactionSent() {
        await this.sentMsg.waitForDisplayed({ timeout: 60000 });
        return true;
    }
}

module.exports = new TransactionsPage();
