import {config} from './protractor.shared.conf';

config.specs = ['../desktop.spec.js'];

config.seleniumAddress = 'http://localhost:4444/wd/hub/';

config.capabilities = {
    browserName: 'chrome',
    logName: "Chrome",
    shardTestFiles: true,
    chromeOptions: {
        args: ['disable-infobars']
    },
};

exports.config = config;