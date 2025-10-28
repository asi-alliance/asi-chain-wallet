const BasePage = require('./BasePage');

class DashboardPage extends BasePage {

    get connectedStatus() {
        return $("//span[contains(., 'Connected')]");
    }


    
    async isConnected() {
        await this.connectedStatus.waitForDisplayed({ timeout: 10000 });
    }
}

module.exports = new DashboardPage();