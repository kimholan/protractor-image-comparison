import {normalize} from 'path';
import * as assert from 'assert';
import {InstanceData} from "./InstanceData";
import {DEFAULT_FORMAT_STRING} from "../constants";
import saveScreen from '../commands/saveScreen';

export abstract class BaseImageComparisonClient {
    private addressBarShadowPadding: number;
    private autoSaveBaseline: boolean;
    private baselineFolder: string;
    private baseFolder: string;
    private debug: boolean;
    private disableCSSAnimation: boolean;
    private hideScrollBars: boolean;
    private formatString: string;
    private nativeWebScreenshot: boolean;
    private toolBarShadowPadding: number;

    constructor(options: any) {
        assert.ok(options.baselineFolder, 'Image baselineFolder not given.');
        assert.ok(options.screenshotPath, 'Image screenshotPath not given.');

        this.autoSaveBaseline = options.autoSaveBaseline || false;
        this.baselineFolder = normalize(options.baselineFolder);
        this.baseFolder = normalize(options.screenshotPath);
        this.debug = !!options.debug;
        this.disableCSSAnimation = !!options.disableCSSAnimation;
        this.formatString = options.formatImageName || DEFAULT_FORMAT_STRING;
        this.hideScrollBars = options.hideScrollBars !== false;
        this.nativeWebScreenshot = !!options.nativeWebScreenshot;
        this.addressBarShadowPadding = 6; // @TODO: check what to do with it
        this.toolBarShadowPadding = 6; // @TODO: check what to do with it
    }

    abstract async executeClientScript<T>(script: Function | string, ...scriptArgs: any[]): Promise<T>;

    abstract async getInstanceData(): Promise<InstanceData>;

    abstract async takeScreenshot(): Promise<string>;

    /**
     * Saves an image of the screen
     *
     * @method saveScreen
     *
     * @example
     * // Default
     * browser.protractorImageComparison.saveScreen('imageA');
     * // Disable css animation on all elements
     * browser.protractorImageComparison.saveScreen('imageA',{disableCSSAnimation: true});
     *
     * @param {string} tag The tag that is used
     * @param {object} options (non-default) options
     * @param {boolean} options.disableCSSAnimation enable or disable CSS animation
     * @param {boolean} options.hideScrollBars hide or show scrollbars
     *
     * @returns {Promise} The image has been saved when the promise is resolved
     *
     * @public
     */
    async saveScreen(tag: string, options?: { disableCSSAnimation: boolean, hideScrollBars: boolean }): Promise<any> {
        return saveScreen(
            this.executeClientScript,
            this.getInstanceData,
            this.takeScreenshot,
            tag,
            {
                addressBarShadowPadding: this.addressBarShadowPadding,
                debug: this.debug,
                disableCSSAnimation: this.disableCSSAnimation,
                hideScrollBars: this.hideScrollBars,
                nativeWebScreenshot: this.nativeWebScreenshot,
                toolBarShadowPadding: this.toolBarShadowPadding,
                ...(options)
            }
        );
    }
}