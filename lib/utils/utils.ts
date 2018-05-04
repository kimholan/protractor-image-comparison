import {PLATFORMS} from "../constants";
import {InstanceData} from "../interfaces/InstanceData";
import {EnrichedInstanceData} from "../interfaces/EnrichedInstanceData";
import {EnrichInstanceDataWith} from "../interfaces/EnrichInstanceDataWith";

/**
 * Checks if the os is Android
 *
 * @param {string} platformName
 *
 * @returns {boolean}
 */
export function platformIsAndroid(platformName: string) {
    return platformName.toLowerCase() === PLATFORMS.ANDROID;
}

/**
 * Checks if the os is IOS
 *
 * @param {string} platformName
 *
 * @returns {boolean}
 */
export function platformIsIos(platformName: string) {
    return platformName.toLowerCase() === PLATFORMS.IOS;
}


export function enrichInstanceData(options: EnrichInstanceDataWith, instanceData: InstanceData): EnrichedInstanceData {
    const isAndroid = platformIsAndroid(instanceData.platformName);
    const isIos = platformIsIos(instanceData.platformName);
    const isMobile = instanceData.platformName !== '';
    const testInBrowser = instanceData.browserName !== '';
    const testInMobileBrowser = isMobile && testInBrowser;

    // nativeWebScreenshot of the constructor can be overruled by the capabilities when the constructor value is false
    const isNativeWebScreenshot = !options.nativeWebScreenshot ? !!instanceData.nativeWebScreenshot : options.nativeWebScreenshot;

    const addressBarShadowPadding = (testInMobileBrowser && ((isNativeWebScreenshot && isAndroid) || isIos)) ? options.addressBarShadowPadding : 0;
    const toolBarShadowPadding = (testInMobileBrowser && isIos) ? options.toolBarShadowPadding : 0;

    return {
        ...(instanceData),
        addressBarShadowPadding,
        isAndroid,
        isIos,
        isMobile,
        isNativeWebScreenshot,
        testInBrowser,
        testInMobileBrowser,
        toolBarShadowPadding
    };
}