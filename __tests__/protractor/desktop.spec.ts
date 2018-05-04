import {browser, element, by, By, $, $$, ExpectedConditions} from 'protractor';


describe('log data', () => {
    beforeEach(async done => {
        await browser.get(browser.baseUrl);
        await browser.sleep(500);
        return done;
    });

    it('should log the getScreenDimension', async (): Promise<any> => {
        console.log('saveScreen = ', await browser.imageComparison.saveScreen('example'));
    });
});