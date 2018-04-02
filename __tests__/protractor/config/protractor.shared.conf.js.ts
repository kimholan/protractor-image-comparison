import {browser, Config} from 'protractor';
import {join} from 'path';

export const config: Config = {
    baseUrl: 'https://wswebcreation.github.io/protractor-image-comparison/',
    disableChecks: true,
    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 120000,
        isVerbose: true,
        includeStackTrace: true,
        print: function () {
        }
    },
    onPrepare: function () {
        browser.waitForAngularEnabled(false);

        return browser.getProcessedConfig()
            .then((_): any => {
                browser.browserName = _.capabilities.browserName.toLowerCase();
                browser.logName = _.capabilities.logName;
                browser.imageComparison = require(join(process.cwd(), '.dist', 'lib', 'interfaces', 'Interfaces')).protractor({
                    baselineFolder: 'here/there/',
                    debug: false,
                    formatImageName: `{tag}-{somethin}-{width}x{height}`,
                    screenshotPath: 'here/nowhere/'
                });

                if (!('platformName' in _.capabilities)) {
                    return browser.driver.manage().window().setSize(1366, 768);
                }
            });
    }
};
