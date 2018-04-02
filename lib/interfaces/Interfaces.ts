import ProtractorClient from './protractor/protractor';

class Interfaces {
    protractor(options:any) {
        return new ProtractorClient(options);
    }
}

module.exports = new Interfaces();