'use strict';

const libpng = require('node-libpng');
const assert = require('assert');
const camelCase = require('camel-case');
const fs = require('fs-extra');
const path = require('path');
const resembleJS = require('./lib/compareImages');

/**
 * image-diff protractor plugin class
 *
 * @constructor
 * @class ProtractorImageComparison
 * @param {object} options
 * @param {string} options.baselineFolder Path to the baseline folder
 * @param {string} options.screenshotPath Path to the folder where the screenshots are saved
 * @param {boolean} options.autoSaveBaseline If no baseline image is found the image is automatically copied to the baselinefolder
 * @param {boolean} options.debug Add some extra logging and always save the image difference (default:false)
 * @param {string} options.formatImageName Custom variables for Image Name (default:{tag}-{browserName}-{width}x{height}-dpr-{dpr})
 * @param {boolean} options.disableCSSAnimation Disable all css animations on a page (default:false)
 * @param {boolean} options.hideScrollBars Hide all scrolls on a page (default:true)
 * @param {boolean} options.ignoreAntialiasing compare images an discard anti aliasing
 * @param {boolean} options.ignoreColors Even though the images are in colour, the comparison wil compare 2 black/white images
 * @param {boolean} options.ignoreTransparentPixel Will ignore all pixels that have some transparency in one of the images
 * @param {number} options.saveAboveTolerance Allowable value of misMatchPercentage that prevents saving image with differences
 *
 * @property {string} actualFolder Path where the actual screenshots are saved
 * @property {number} browserHeight height of the browser
 * @property {string} browserName name of the browser that is used to execute the test on
 * @property {number} browserWidth width of the browser
 * @property {string} deviceName the kind of mobile device or emulator to use
 * @property {string} diffFolder Path where the differences are saved
 * @property {number} devicePixelRatio Ratio of the (vertical) size of one physical pixel on the current display device to the size of one device independent pixels(dips)
 * @property {number} fullPageHeight fullPageHeight of the browser including scrollbars
 * @property {number} fullPageWidth fullPageWidth of the browser including scrollbars *
 * @property {string} logName logName from the capabilities
 * @property {string} name Name from the capabilities
 * @property {string} platformName mobile OS platform to use
 * @property {number} resizeDimensions dimensions that will be used to make the the element coordinates bigger. This needs to be in pixels
 * @property {number} screenshotHeight height of the screenshot of the page
 * @property {number} viewPortHeight is the height of the browser window's viewport (was innerHeight
 *
 */
class ProtractorImageComparison {
  constructor(options) {
    assert.ok(options.baselineFolder, 'Image baselineFolder not given.');
    assert.ok(options.screenshotPath, 'Image screenshotPath not given.');

    this.baselineFolder = path.normalize(options.baselineFolder);
    this.baseFolder = path.normalize(options.screenshotPath);
    this.autoSaveBaseline = options.autoSaveBaseline || false;
    this.debug = options.debug || false;
    this.disableCSSAnimation = options.disableCSSAnimation || false;
    this.hideScrollBars = options.hideScrollBars !== false;
    this.formatString = options.formatImageName || '{tag}-{browserName}';

    this.ignoreAntialiasing = options.ignoreAntialiasing || false;
    this.ignoreColors = options.ignoreColors || false;
    this.ignoreTransparentPixel = options.ignoreTransparentPixel || false;
    this.saveAboveTolerance = options.saveAboveTolerance || 0;


    this.actualFolder = path.join(this.baseFolder, 'actual');
    this.browserHeight = 0;
    this.browserName = '';
    this.browserWidth = 0;
    this.deviceName = '';
    this.diffFolder = path.join(this.baseFolder, 'diff');
    this.devicePixelRatio = 1;
    this.fullPageHeight = 0;
    this.fullPageWidth = 0;
    this.logName = '';
    this.name = '';
    this.platformName = '';
    this.resizeDimensions = 0;
    this.screenshotHeight = 0;
    this.viewPortHeight = 0;

    fs.ensureDirSync(this.actualFolder);
    fs.ensureDirSync(this.baselineFolder);
    fs.ensureDirSync(this.diffFolder);

  }


  /**
   * Checks if image exists as a baseline image, if not, create a baseline image if needed
   * @param {string} tag
   *
   * @returns {Promise}
   * @private
   */
  _checkImageExists(tag) {
    const fileName = this._formatFileName(tag);
    return new Promise((resolve, reject) => {
      fs.access(path.join(this.baselineFolder, fileName), error => {
        if (error) {
          if (this.autoSaveBaseline) {
            try {
              fs.copySync(path.join(this.actualFolder, fileName), path.join(this.baselineFolder, fileName));
              console.log(`\nINFO: Autosaved the image to ${path.join(this.baselineFolder, fileName)}\n`);
            } catch (error) {
              reject(`Image could not be copied. The following error was thrown: ${error}`);
            }
          } else {
            reject('Image not found, autoSaveBaseline disabled.');
          }
        }
        resolve();
      });
    });
  }

  /**
   * Determine the rectangles conform the correct browser / devicePixelRatio
   * @param {Promise} element The ElementFinder to get the rectangles of
   *
   * @returns {Promise.<object>} returns the correct rectangles rectangles
   * @private
   */
  _determineRectangles(element) {
    let elementHeight;
    let rect;
    let elementWidth;
    let xCoordinate;
    let yCoordinate;

    return element.getSize()
      .then(elementSize => {
        elementHeight = elementSize.height;
        elementWidth = elementSize.width;

        return this._getElementPosition(element);
      })
      .then(position => {
        xCoordinate = Math.round(position.x);
        yCoordinate = Math.round(position.y);

        if (xCoordinate < this.resizeDimensions) {
          console.log('\n WARNING: The x-coordinate may not be negative. No width resizing of the element has been executed\n');
        } else if (((xCoordinate - this.resizeDimensions) + elementWidth + 2 * this.resizeDimensions) > this.browserWidth) {
          console.log('\n WARNING: The new x-coordinate may not be outside the screen. No width resizing of the element has been executed\n');
        } else {
          xCoordinate = xCoordinate - this.resizeDimensions;
          elementWidth = elementWidth + 2 * this.resizeDimensions
        }

        if (yCoordinate < this.resizeDimensions) {
          console.log('\n WARNING: The y-coordinate may not be negative. No height resizing of the element has been executed\n');
        } else if ((yCoordinate < this.browserHeight && ((yCoordinate - this.resizeDimensions) + elementHeight + 2 * this.resizeDimensions) > this.browserHeight) ||
          ((yCoordinate - this.resizeDimensions) + elementHeight + 2 * this.resizeDimensions) > this.screenshotHeight) {
          console.log('\n WARNING: The new y-coordinate may not be outside the screen. No height resizing of the element has been executed\n');
        } else {
          yCoordinate = yCoordinate - this.resizeDimensions;
          elementHeight = elementHeight + 2 * this.resizeDimensions
        }

        rect = {
          height: elementHeight,
          width: elementWidth,
          x: xCoordinate,
          y: yCoordinate
        };

        return this._multiplyObjectValuesAgainstDPR(rect);
      });
  }

  /**
   * Determines the image comparison paths with the tags for the paths + filenames
   * @param {string} tag the tag that is used
   *
   * @returns {Object}
   * @private
   */
  _determineImageComparisonPaths(tag) {
    const imageComparisonPaths = {};
    const tagName = this._formatFileName(tag);

    imageComparisonPaths['actualImage'] = path.join(this.actualFolder, tagName);
    imageComparisonPaths['baselineImage'] = path.join(this.baselineFolder, tagName);
    imageComparisonPaths['imageDiffPath'] = path.join(this.diffFolder, path.basename(tagName));

    return imageComparisonPaths;
  }

  /**
   * Compare images against each other
   * @param {string} tag The tag that is used
   * @param {object} compareOptions comparison options
   * @param {object} compareOptions.blockOut blockout with x, y, width and height values
   * @param {boolean} compareOptions.ignoreAntialiasing compare images an discard anti aliasing
   * @param {boolean} compareOptions.ignoreColors Even though the images are in colour, the comparison wil compare 2 black/white images
   * @param {boolean} compareOptions.ignoreTransparentPixel Will ignore all pixels that have some transparency in one of the images
   * @param {number} compareOptions.saveAboveTolerance Allowable value of misMatchPercentage that prevents saving image with differences
   * @returns {Promise}
   * @private
   */
  async _executeImageComparison(tag, compareOptions) {
    const imageComparisonPaths = this._determineImageComparisonPaths(tag);
    const ignoreRectangles = 'blockOut' in compareOptions ? compareOptions.blockOut : [];
    const saveAboveTolerance = compareOptions.saveAboveTolerance || this.saveAboveTolerance;
    const options = {
      ignore: []
    };

    compareOptions.ignoreAlpha = 'ignoreAlpha' in compareOptions ? compareOptions.ignoreAlpha : this.ignoreAlpha;
    compareOptions.ignoreAntialiasing = 'ignoreAntialiasing' in compareOptions ? compareOptions.ignoreAntialiasing : this.ignoreAntialiasing;
    compareOptions.ignoreColors = 'ignoreColors' in compareOptions ? compareOptions.ignoreColors : this.ignoreColors;
    compareOptions.ignoreLess = 'ignoreLess' in compareOptions ? compareOptions.ignoreLess : this.ignoreLess;
    compareOptions.ignoreNothing = 'ignoreNothing' in compareOptions ? compareOptions.ignoreNothing : this.ignoreNothing;
    compareOptions.ignoreRectangles = 'ignoreRectangles' in compareOptions ? compareOptions.ignoreRectangles.concat(ignoreRectangles) : ignoreRectangles;
    compareOptions.ignoreTransparentPixel = 'ignoreTransparentPixel' in compareOptions ? compareOptions.ignoreTransparentPixel : this.ignoreTransparentPixel;
    compareOptions.ignoreRectangles = compareOptions.ignoreRectangles.map(rectangles => this._multiplyObjectValuesAgainstDPR(rectangles));

    if (this.debug) {
      console.log('\n####################################################');
      console.log('compareOptions = ', compareOptions);
      console.log('####################################################\n');
    }

    if (compareOptions.ignoreAlpha) {
      options.ignore.push('alpha')
    }
    if (compareOptions.ignoreAntialiasing) {
      options.ignore.push('antialiasing')
    }
    if (compareOptions.ignoreColors) {
      options.ignore.push('colors')
    }
    if (compareOptions.ignoreLess) {
      options.ignore.push('less')
    }
    if (compareOptions.ignoreNothing) {
      options.ignore.push('nothing')
    }

    options.ignoreRectangles = compareOptions.ignoreRectangles;
    options.ignoreTransparentPixel = compareOptions.ignoreTransparentPixel;


    const data = await resembleJS(
      fs.readFileSync(imageComparisonPaths.baselineImage),
      fs.readFileSync(imageComparisonPaths.actualImage),
      options
    );

    const misMatchPercentage = this.rawMisMatchPercentage ? data.rawMisMatchPercentage : Number(data.rawMisMatchPercentage.toFixed(2));
    if (misMatchPercentage > saveAboveTolerance || this.debug) {
      fs.writeFileSync(imageComparisonPaths.imageDiffPath, data.getBuffer());
    }
    return misMatchPercentage;
  }

  /**
   * _formatFileName
   * @param {string} tag The tag that is used
   * @returns {string} Returns a formatted string
   * @private
   */
  _formatFileName(tag) {
    let defaults = {
      'browserName': this.browserName,
      'deviceName': this.deviceName,
      'dpr': this.devicePixelRatio,
      'height': this.browserHeight,
      'logName': camelCase(this.logName),
      'name': this.name,
      'tag': tag,
      'width': this.browserWidth
    };
    let formatString = this.formatString;

    defaults = ProtractorImageComparison._mergeDefaultOptions(defaults, this.formatOptions);

    Object.keys(defaults).forEach(function (value) {
      formatString = formatString.replace(`{${value}}`, defaults[value]);
    });

    return formatString + '.png';
  }


  /**
   * Get browserdata containing sizes, heights and so on to update the the constructor properties
   * @return {Promise}
   * @private
   */
  _getBrowserData() {
    return browser.driver.executeScript(retrieveData)
      .then(browserData => {
        this.browserHeight = browserData.height !== 0 ? browserData.height : browserData.viewPortHeight;
        this.browserWidth = browserData.width !== 0 ? browserData.width : browserData.viewPortWidth;
        this.devicePixelRatio = browserData.pixelRatio;
        this.fullPageHeight = browserData.fullPageHeight;
        this.fullPageWidth = browserData.fullPageWidth;
        this.viewPortHeight = browserData.viewPortHeight;
        this.viewPortWidth = browserData.viewPortWidth;
      });

    // For viewPortWidth use document.body.clientWidth so we don't get the scrollbar included in the size
    function retrieveData() {
      return {
        fullPageHeight: document.body.scrollHeight,
        fullPageWidth: document.body.scrollWidth,
        height: window.outerHeight,
        pixelRatio: window.devicePixelRatio,
        viewPortWidth: document.body.clientWidth,
        viewPortHeight: window.innerHeight,
        width: window.outerWidth
      };
    }
  }

  /**
   * Get the position of the element based on OS / Browser / Device.
   * Some webdrivers make a screenshot of the complete page, not of the visible part.
   * A device can make a complete screenshot of the screen, including statusbar and addressbar / buttonbar, but it can
   * also be created with ChromeDriver. Then a screenshot will be made of the viewport and the calculation is the same
   * as for a Chrome desktop browser.
   * The rest of the browsers make a screenshot of the visible part.
   * @param {Promise} element The ElementFinder that is used to get the position
   * @returns {Promise.<object>} The x/y position of the element
   * @private
   */
  _getElementPosition(element) {
    if (this.screenshotHeight > this.viewPortHeight) {
      return this._getElementPositionTopPage(element);
    }

    return this._getElementPositionTopWindow(element);
  }

  /**
   * Get the position of a given element according to the TOP of the PAGE
   * @param {Promise} element The ElementFinder that is used to get the position
   *
   * @returns {Promise} The x/y position of the element
   * @private
   */
  _getElementPositionTopPage(element) {
    return element.getLocation()
      .then(point => {
        return {x: point.x, y: point.y};
      });
  }

  /**
   * Get the position of a given element according to the TOP of the WINDOW
   * @param {Promise} element The ElementFinder that is used to get the position
   *
   * @returns {Promise} The x/y position of the element
   * @private
   */
  _getElementPositionTopWindow(element) {
    return browser.driver.executeScript('return arguments[0].getBoundingClientRect();', element.getWebElement())
      .then(position => {
        return {x: position.left, y: position.top};
      });
  }

  /**
   * Set the data of the instance that is running
   *
   * @returns {Promise.<object>}
   * @private
   */
  async _getInstanceData() {
    const browserConfig = await browser.getProcessedConfig();

    this.browserName = browserConfig.capabilities.browserName ? browserConfig.capabilities.browserName.toLowerCase() : '';
    this.logName = browserConfig.capabilities.logName ? browserConfig.capabilities.logName : '';
    this.name = browserConfig.capabilities.name ? browserConfig.capabilities.name : '';

    // Used for mobile
    this.platformName = browserConfig.capabilities.platformName ? browserConfig.capabilities.platformName.toLowerCase() : '';
    this.deviceName = browserConfig.capabilities.deviceName ? browserConfig.capabilities.deviceName.toLowerCase() : '';
    // this.nativeWebScreenshot of the constructor can be overruled by the capabilities when the constructor value is false
    if (!this.nativeWebScreenshot) {
      this.nativeWebScreenshot = !!browserConfig.capabilities.nativeWebScreenshot;
    }
    this._setCustomTestCSS();
    this._getBrowserData();
  }


  /**
   * Merges non-default options from optionsB into optionsA
   *
   * @method mergeDefaultOptions
   * @param {object} optionsA
   * @param {object} optionsB
   *
   * @returns {object}
   * @private
   */
  static _mergeDefaultOptions(optionsA, optionsB) {
    optionsB = (typeof optionsB === 'object') ? optionsB : {};

    for (let option in optionsB) {
      if (optionsA.hasOwnProperty(option)) {
        optionsA[option] = optionsB[option];
      }
    }

    return optionsA;
  }

  /**
   * Return the values of an object multiplied against the devicePixelRatio
   * @param {object} values
   *
   * @returns {Object}
   * @private
   */
  _multiplyObjectValuesAgainstDPR(values) {
    Object.keys(values).map(value => {
      values[value] *= this.devicePixelRatio;
    });

    return values;
  }

  /**
   * Save a cropped screenshot
   * @param {string} bufferedScreenshot a new Buffer screenshot
   * @param {string} folder path of the folder where the image needs to be saved
   * @param {object} rectangles x, y, height and width data to determine the crop
   * @param {string} tag The tag that is used
   *
   * @returns {Promise} The image has been saved when the promise is resoled
   * @private
   */
  _saveCroppedScreenshot(bufferedScreenshot, folder, rectangles, tag) {
    const image = libpng.decode(bufferedScreenshot);
    const clip = libpng.rect(rectangles.x, rectangles.y, rectangles.width, rectangles.height);
    image.crop(clip);
    return libpng.writePngFileSync(path.join(folder, this._formatFileName(tag)), image.data, rectangles);
  }

  /**
   * Set inline CSS on the page under test that is needed to execute the image comparison.
   *
   * @returns {Promise}
   * @private
   */
  _setCustomTestCSS() {
    return browser.driver.executeScript(setCSS, this.disableCSSAnimation, this.hideScrollBars);

    function setCSS(disableCSSAnimation, hideScrollBars) {
      var animation = '* {' +
        '-webkit-transition-duration: 0s !important;' +
        'transition-duration: 0s !important;' +
        '-webkit-animation-duration: 0s !important;' +
        'animation-duration: 0s !important;' +
        '}',
        scrollBar = '*::-webkit-scrollbar { display:none; !important}',
        css = (disableCSSAnimation ? animation : '') + (hideScrollBars ? scrollBar : ''),
        head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');

      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }

  /**
   * Runs the comparison against an element
   *
   * @method checkElement
   *
   * @example
   * // default
   * browser.ProtractorImageComparison.checkElement(element(By.id('elementId')), 'imageA');
   * // With options
   * browser.ProtractorImageComparison.checkElement(element(By.id('elementId')), 'imageA', {
   *      // Blockout the statusbar, mobile only
   *      blockOutStatusBar: true
   *      // Blockout a given region || multiple regions
   *      blockOut: [
   *        {x: 10, y: 132, width: 100, height: 50},
   *        {x: 450, y: 300, width: 25, height: 75},
   *      ],
   * // Disable css animation on all elements
   *      disableCSSAnimation: true,
   *      // Add 15 px to top, right, bottom and left when the cut is calculated (it will automatically use the DPR)
   *      resizeDimensions: 15,
   *      // Set allowable percentage of mismatches before a diff is saved
   *      saveAboveTolerance: 0.5,
   *      // Ignore alpha and or antialiasing and or colors and or less and or nothing and or a transparant pixel
   *      ignoreAlpha: true,
   *      ignoreAntialiasing: true,
   *      ignoreColors: true,
   *      ignoreLess: true,
   *      ignoreNothing: true,
   *      ignoreTransparentPixel: true,
   *    }
   * );
   *
   * @param {Promise} element The ElementFinder that is used to get the position
   * @param {string} tag The tag that is used
   * @param {object} options non-default options
   * @param {object} options.blockOut blockout with x, y, width and height values
   * @param {int} options.resizeDimensions the value to increase the size of the element that needs to be saved
   * @param {boolean} options.ignoreAntialiasing compare images an discard anti aliasing
   * @param {boolean} options.ignoreColors Even though the images are in colour, the comparison wil compare 2 black/white images
   * @param {boolean} options.ignoreTransparentPixel Will ignore all pixels that have some transparency in one of the images
   * @return {Promise} When the promise is resolved it will return the percentage of the difference
   * @public
   */
  async checkElement(element, tag, options) {
    const checkOptions = options || {};

    await this.saveElement(element, tag, checkOptions);
    await this._checkImageExists(tag);

    return await this._executeImageComparison(tag, checkOptions);
  }

  /**
   * Runs the comparison against the screen
   *
   * @method checkScreen
   *
   * @example
   * // default
   * browser.ProtractorImageComparison.checkScreen('imageA');
   * // Blockout a given region
   * browser.ProtractorImageComparison.checkScreen('imageA', {blockOut: [{x: 10, y: 132, width: 100, height: 50}]});
   * // Disable css animation on all elements
   * browser.ProtractorImageComparison.checkScreen('imageA', {disableCSSAnimation: true});
   * // Ignore antialiasing
   * browser.ProtractorImageComparison.checkScreen('imageA', {ignoreAntialiasing: true});
   * // Ignore colors
   * browser.ProtractorImageComparison.checkScreen('imageA', {ignoreColors: true});
   * // Ignore alpha pixel
   * browser.ProtractorImageComparison.checkScreen('imageA', {ignoreTransparentPixel: true});

   *
   * @param {string} tag The tag that is used
   * @param {object} options (non-default) options
   * @param {object} options.blockOut blockout with x, y, width and height values
   * @param {boolean} options.disableCSSAnimation enable or disable CSS animation
   * @param {boolean} options.ignoreAntialiasing compare images an discard anti aliasing
   * @param {boolean} options.ignoreColors Even though the images are in colour, the comparison wil compare 2 black/white images
   * @param {boolean} options.ignoreTransparentPixel Will ignore all pixels that have some transparency in one of the images
   * @return {Promise} When the promise is resolved it will return the percentage of the difference
   * @public
   */
  async checkScreen(tag, options) {
    let checkOptions = options || {};

    await this.saveScreen(tag, checkOptions);
    await this._checkImageExists(tag);
    await this._executeImageComparison(tag, checkOptions);
  }

  /**
   * Saves an image of the screen element
   *
   * @method saveElement
   *
   * @example
   * // Default
   * browser.ProtractorImageComparison.saveElement(element(By.id('elementId')), 'imageA');
   * // Add 15 px to top, right, bottom and left when the cut is calculated (it will automatically use the DPR)
   * browser.ProtractorImageComparison.saveElement(element(By.id('elementId')), 'imageA', {resizeDimensions: 15});
   * // Disable css animation on all elements
   * browser.ProtractorImageComparison.saveElement(element(By.id('elementId')), 'imageA', {disableCSSAnimation: true});
   *
   * @param {Promise} element The ElementFinder that is used to get the position
   * @param {string} tag The tag that is used
   * @param {object} options (non-default) options
   * @param {int} options.resizeDimensions the value to increase the size of the element that needs to be saved
   * @param {boolean} options.disableCSSAnimation enable or disable CSS animation
   * @returns {Promise} The images has been saved when the promise is resolved
   * @public
   */
  async saveElement(element, tag, options) {
    let saveOptions = options || [];
    let bufferedScreenshot;

    this.resizeDimensions = saveOptions.resizeDimensions ? saveOptions.resizeDimensions : this.resizeDimensions;
    this.disableCSSAnimation = saveOptions.disableCSSAnimation || saveOptions.disableCSSAnimation === false ? saveOptions.disableCSSAnimation : this.disableCSSAnimation;

    let instanceData = await this._getInstanceData();


    if (this.autoSaveBaseline) {
      // Workaround for (partial) blank screenshots
      let screenshots = [];
      screenshots.push(Buffer.from(await browser.takeScreenshot(), 'base64'));
      screenshots.push(Buffer.from(await browser.takeScreenshot(), 'base64'));

      bufferedScreenshot = screenshots[0];
      if (screenshots[0].equals(screenshots[1])) {
        bufferedScreenshot = screenshots[1];
      } else {
        screenshots.push(Buffer.from(await browser.takeScreenshot(), 'base64'));
        if (screenshots[0].equals(screenshots[2])) {
          bufferedScreenshot = screenshots[2];
        } else if (screenshots[1].equals(screenshots[2])) {
          bufferedScreenshot = screenshots[1];
        } else {
          console.log('WARNING Unstable screenshots');
        }
      }
    } else {
      bufferedScreenshot = Buffer.from(await browser.takeScreenshot(), 'base64');
    }

    this.screenshotHeight = (bufferedScreenshot.readUInt32BE(20) / this.devicePixelRatio); // width = 16

    const rectangles = await this._determineRectangles(element);
    await this._saveCroppedScreenshot(bufferedScreenshot, this.actualFolder, rectangles, tag);
  }


  /**
   * Saves an image of the screen
   *
   * @method saveScreen
   *
   * @example
   * // default
   * browser.ProtractorImageComparison.saveScreen('imageA');
   * // With options
   * browser.ProtractorImageComparison.saveScreen('imageA', {
   * // Disable css animation on all elements
   *      disableCSSAnimation: true,
   *    }
   * );
   *
   * @param {string} tag The tag that is used
   * @param {object} options (non-default) options
   * @param {boolean} options.disableCSSAnimation enable or disable CSS animation
   *
   * @returns {Promise} The image has been saved when the promise is resolved
   * @public
   */
  async saveScreen(tag, options) {
    let saveOptions = options || [];

    this.disableCSSAnimation = saveOptions.disableCSSAnimation || saveOptions.disableCSSAnimation === false ? saveOptions.disableCSSAnimation : this.disableCSSAnimation;

    await this._getInstanceData();
    const screenshot = await browser.takeScreenshot();

    const bufferedScreenshot = Buffer.from(screenshot, 'base64');
    this.screenshotHeight = (bufferedScreenshot.readUInt32BE(20) / this.devicePixelRatio); // width = 16

    const rectangles = this._multiplyObjectValuesAgainstDPR({
      height: this.screenshotHeight > this.viewPortHeight ? this.screenshotHeight : this.viewPortHeight,
      width: this.viewPortWidth,
      x: 0,
      y: 0
    });
    await this._saveCroppedScreenshot(bufferedScreenshot, this.actualFolder, rectangles, tag);
  }
}

module.exports = ProtractorImageComparison;