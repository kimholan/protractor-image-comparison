import {browser} from 'protractor';
import {ImageComparisonClient} from '../ImageComparisonClient';
import {BaseImageComparisonClient} from '../base.client';
import {InstanceData} from "../InstanceData";

export default class ProtractorClient extends BaseImageComparisonClient implements ImageComparisonClient {
    /** {@inheritDoc}. */
    async executeClientScript<T>(script: Function | string, ...scriptArgs: any[]): Promise<T> {
        return browser.driver.executeScript<T>(script, scriptArgs);
    }

    /** {@inheritDoc}. */
    async getInstanceData(): Promise<InstanceData> {
        // Get the current configuration of the instance that is running
        const instanceConfig = (await browser.getProcessedConfig()).capabilities;

        // Substract the needed data from the running instance
        const browserName = (instanceConfig.browserName || '').toLowerCase();
        const logName = instanceConfig.logName || '';
        const name = instanceConfig.name || '';

        // For mobile
        const platformName = (instanceConfig.platformName || '').toLowerCase();
        const deviceName = (instanceConfig.deviceName || '').toLowerCase();
        const nativeWebScreenshot = !!instanceConfig.nativeWebScreenshot;

        return {
            browserName,
            deviceName,
            logName,
            name,
            nativeWebScreenshot,
            platformName,
        }
    }

    /** {@inheritDoc}. */
    async takeScreenshot():Promise<string> {
        return browser.takeScreenshot();
    }
}