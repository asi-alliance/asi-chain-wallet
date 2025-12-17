class BasePage {
    async open(url) {
        await browser.url(url);
    }

    async click(element) {
        const el = typeof element === 'string' ? $(element) : element;
        
        await browser.execute((target) => {
            target.click();
        }, await el);
    }

    async setValue(element, value) {
        await element.waitForDisplayed();
        await element.setValue(value);
    }

    async getText(element) {
        const el = typeof element === 'string' ? $(element) : element;
        await el.waitForDisplayed();
        return await el.getText();
    }

    async isDisplayed(element) {
        const el = typeof element === 'string' ? $(element) : element;
        return await el.isDisplayed();
    }

    async isMobile() {
        const { width } = await browser.getWindowSize();
        return width <= 1024;
    }
}

module.exports = BasePage;