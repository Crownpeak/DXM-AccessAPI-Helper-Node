const util = require('./util');

/**
 * An object that contains methods for getting report information
 */
class Report {

    constructor(api) {
        this.api = api;
    }

    set api(api) {
        this._api = api;
    }

    /**
     * Get the sitesummary for the instance
     */
    async siteSummary(){
        return await util.makeCall(this._api,"/Report/sitesummary/",{});
    }
}

module.exports = Report;