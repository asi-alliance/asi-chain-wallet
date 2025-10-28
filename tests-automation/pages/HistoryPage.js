const BasePage = require('./BasePage');

class HistoryPage extends BasePage {
    get emptyHistoryMessage() {
        return $('//*[contains(text(),"No transactions found for")]');
    }

    get firstTransactionRow() {
        return $('//table//tr[1]');
      }
    
      get deployType() {
        return this.firstTransactionRow.$('.//span[@type="deploy"]');
      }
    
      get status() {
        return this.firstTransactionRow.$('.//span[@status]');
      }
    
      get deployId() {
        return this.firstTransactionRow.$('./td[last()]');
      }

      get refreshHistoryBtn() {
        return $('#history-refresh-button');
      }

      async waitForConfirmedDeploy(timeout = 120000) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            if (await this.refreshHistoryBtn.isDisplayed()) {
                await this.refreshHistoryBtn.click();
                console.log('🔄 Clicked history refresh button');
            }

            const rows = await $$('tbody tr[id^="history-transaction-row-"]');

            for (const row of rows) {
                const deploySpan = await row.$('span[type="deploy"]');
                if (await deploySpan.isExisting()) {
                    const statusSpan = await row.$('span[status]');
                    const status = await statusSpan.getAttribute('status');
                    console.log(`Current deploy status: ${status}`);
                    if (status === 'confirmed') {
                        console.log('✅ Deploy confirmed!');
                        return true;
                    }
                }
            }

            await browser.pause(3000); // ждём между обновлениями
        }

        throw new Error('❌ Timeout waiting for deploy to be confirmed');
    }

    async isHistoryNotEmpty() {
        return !(await this.emptyHistoryMessage.isExisting());
    }
}

module.exports = new HistoryPage();
