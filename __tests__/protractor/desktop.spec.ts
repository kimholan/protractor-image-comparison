import {browser, element, by, By, $, $$, ExpectedConditions} from 'protractor';


describe('log data', () => {

    it('should log the getScreenDimension', async (): Promise<any> => {
        console.log('saveScreen = ', await browser.imageComparison.saveScreen());
    });
});