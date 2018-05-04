import {InstanceData} from "../interfaces/InstanceData";
import getScreenDimensions from "../scripts/getScreenDimensions";
import {enrichInstanceData} from "../utils/utils";
import screenshotInitializer from "../modules/screenshotInitializer";
import screenshotReset from "../modules/screenshotReset";

export default async function (
    executor: Function,
    getInstanceData: Function,
    takeScreenshot: Function,
    tag: string,
    options: any
): Promise<any> {

    // Get the instance data that is needed
    const instanceData: InstanceData = await getInstanceData();

    // Enrich the instanceData with some extra properties
    const enrichedInstanceData = enrichInstanceData({
        addressBarShadowPadding: options.addressBarShadowPadding,
        nativeWebScreenshot: options.nativeWebScreenshot,
        toolBarShadowPadding: options.toolBarShadowPadding
    }, instanceData);

    // Get the browser data
    const browserdata = await executor(getScreenDimensions);

    // Take a screenshot
    // before
    await screenshotInitializer(
        executor,
        {
            addressBarShadowPadding: options.addressBarShadowPadding,
            disableCSSAnimation:options.disableCSSAnimation,
            hideScrollBars: options.hideScrollBars,
            toolBarShadowPadding: options.toolBarShadowPadding
        });
    // take
    const screenshot = await takeScreenshot();
    // reset
    await screenshotReset(executor);

    // Make a buffer out of it


    // determine the rectangles, figure out why the hack did I made it smaller


    // Save the screenshot, need the actual folder

    // Debug
    if (options.debug) {
        console.log('\n######################## SAVE SCREEN ########################');
        console.log('instanceData = ', instanceData);
        console.log('==============================================================');
        console.log('enrichedInstanceData = ', enrichedInstanceData);
        console.log('==============================================================');
        console.log('browserdata = ', browserdata);
        console.log('######################## SAVE SCREEN ########################\n');
    }

    // Do all the magic here
    return Promise.resolve('done');
}