const BasePage = require('./BasePage');

class DeployPage extends BasePage {
  get deployHeader() { return $('//h2[normalize-space()="Deploy Rholang Contract"]'); }
  get codeInput() { return $('#deploy-rholang-code-editor'); }
  get phloLimitInput() { return $('#deploy-phlo-limit-input'); }
  get phloPriceInput() { return $('#deploy-phlo-price-input'); }
  get deployButton() { return $('#deploy-contract-button'); }
  get confirmModal() { return $('//h3[normalize-space()="Confirm Deployment"]'); }
  get confirmDeployButton() { return $('//button[normalize-space()="Deploy Contract"]'); }
  get successMsg() { return $('//div[contains(text(),"Deploy submitted successfully!")]'); }

  async deploySmartContract(code, phloLimit, phloPrice, password) {
    await this.deployHeader.waitForDisplayed({ timeout: 10000 });

    await this.codeInput.waitForDisplayed();
    await this.codeInput.click();
    await browser.keys(['Control', 'a']);
    await browser.keys('Backspace');
    await this.codeInput.setValue(code);

    //await this.phloLimitInput.setValue(phloLimit);
    //await this.phloPriceInput.setValue(phloPrice);

    await this.deployButton.click();

    await this.confirmModal.waitForDisplayed({ timeout: 10000 });
    await this.confirmDeployButton.click();

    await this.successMsg.waitForDisplayed({ timeout: 60000 });
  }

  async getDeployId() {
    const el = await $('//div[contains(@class,"deploy-id")]');
    await el.waitForDisplayed({ timeout: 10000 });
  
    const text = await el.getText();
    const match = text.match(/Deploy ID:\s*([0-9a-fA-F]+)/);
    return match ? match[1].trim() : '';
  }
}
      

module.exports = new DeployPage();