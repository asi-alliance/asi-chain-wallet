class BasePage {
    async open(url) {
        await browser.url(url);
    }

    async click(element) {
        await element.waitForClickable();
        await element.click();
    }

    async setValue(element, value) {
        await element.waitForDisplayed();
        await element.setValue(value);
    }

    async getText(element) {
        await element.waitForDisplayed();
        return await element.getText();
    }

    async isDisplayed(element) {
        return await element.isDisplayed();
    }
    async isMobile() {
        const { width } = await browser.getWindowSize();
        return width <= 1024;
    }
}

module.exports = BasePage;