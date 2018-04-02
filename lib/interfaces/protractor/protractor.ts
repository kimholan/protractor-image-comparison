import {browser} from 'protractor';
import {ImageComparisonClient} from '../ImageComparisonClient';
import {BaseImageComparisonClient} from '../base.client';

export default class ProtractorClient extends BaseImageComparisonClient implements ImageComparisonClient {

    /** {@inheritDoc}. */
    async executeClientScript<T>(script: Function | string, ...scriptArgs: any[]): Promise<T> {
        return browser.driver.executeScript<T>(script, scriptArgs);
    }
}