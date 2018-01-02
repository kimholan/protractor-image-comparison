export interface SaveType {
  element: boolean;
  fullPage: boolean;
  screen: boolean;
}

export interface SaveScreenOptions {
  disableCSSAnimation: boolean;
  hideScrollBars: boolean;
}

export interface CheckScreenOptions {
  blockOutStatusBar: boolean;
  blockOut?: BlockOutRectangles[];
  disableCSSAnimation: boolean;
  hideScrollBars: boolean;
  ignoreAntialiasing: boolean;
  ignoreColors: boolean;
  ignoreTransparentPixel: boolean;
}

export interface BlockOutRectangles {
  x: number,
  y: number,
  height: number,
  width: number
}

export interface Rectangles {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RequestBrowserData {
  addressBarShadowPadding: number;
  browserName: string;
  defaultDevicePixelRatio: number;
  platformName: string;
  toolBarShadowPadding: number;
}

export interface BrowserData {
  browserHeight: number;
  browserWidth: number;
  devicePixelRatio: number;
  fullPageHeight: number;
  fullPageWidth: number;
  viewPortHeight: number;
  viewPortWidth: number;
}

export interface InstanceData extends BrowserData {
  addressBarShadowPadding: number;
  browserName: string;
  deviceName: string;
  logName: string;
  name: string;
  nativeWebScreenshot: boolean;
  platformName: string;
  testInBrowser: boolean;
  toolBarShadowPadding: number;
}

export interface TestInstanceData extends InstanceData{
  fileName: string;
}

export interface FormatFileNameOptions {
  browserName: string;
  deviceName: string;
  devicePixelRatio: number;
  browserHeight: number;
  logName: string;
  isMobile: boolean;
  testInBrowser: boolean;
  name: string;
  tag: string;
  browserWidth: number;
  formatString: string;
}

export interface SaveCroppedScreenshotOptions{
  bufferedScreenshot: Buffer;
  fileName: string;
  folder: string;
  rectangles: Rectangles;
}

export interface SetCustomCssOptions {
  disableCSSAnimation: boolean;
  hideScrollBars: boolean,
  addressBarShadowPadding: number;
  toolBarShadowPadding: number;
}

export interface RequestCurrentInstanceData {
  SAVE_TYPE: SaveType;
  devicePixelRatio: number;
  testInBrowser: boolean;
  nativeWebScreenshot: boolean;
  addressBarShadowPadding: number;
  toolBarShadowPadding: number;
}

export interface Initializer extends RequestCurrentInstanceData{
  disableCSSAnimation: boolean;
  formatString: string;
  hideScrollBars: boolean;
  tag: string;
}

export interface ImageComparisonPaths{
  actualImage: string;
  baselineImage: string;
  imageDiffPath: string;
}

export interface Folders {
  actualFolder: string;
  baseFolder: string;
  baselineFolder: string;
  diffFolder: string;
  tempFullScreenFolder: string;
}

export interface ImageData extends Folders {
  fileName: string;
}

export interface RequestImageExistsData extends ImageData{
  autoSaveBaseline: boolean;
}