import {CheckScreenOptions, SaveScreenOptions} from "./interfaces";

export function initSaveScreenOptions(disableCSSAnimation,
                                      hideScrollBars,
                                      options?: SaveScreenOptions): SaveScreenOptions {
  return {
    disableCSSAnimation,
    hideScrollBars,
    ...(options)
  };
}

export function initCheckScreenOptions(blockOutStatusBar,
                                       disableCSSAnimation,
                                       hideScrollBars,
                                       ignoreAntialiasing,
                                       ignoreColors,
                                       ignoreTransparentPixel,
                                       options?: CheckScreenOptions): CheckScreenOptions {
  return {
    blockOutStatusBar,
    disableCSSAnimation,
    hideScrollBars,
    ignoreAntialiasing,
    ignoreColors,
    ignoreTransparentPixel,
    ...(options)
  };
}