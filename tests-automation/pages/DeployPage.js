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

    //await this.phloLimitInput.setValue(phloLimit);
    //await this.phloPriceInput.setValue(phloPrice);

    if (await this.isMobile()) {
            if (browser.isAndroid) {
                 await browser.hideKeyboard();   
            }
            await $('body').click(); 
            await browser.pause(500);
          }
          
          await this.click(this.deployButton); 
          await this.click(this.confirmDeployButton);
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