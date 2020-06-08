const util = require('./util');

/**
 * An object that contains methods for executing DXM tools
 */
class Tools {

    constructor(api) {
        this.api = api;
    }

    set api(api) {
        this._api = api;
    }

    /**
     * Recompile the specific Library folder
     */
    async recompileLibrary(id){
        return await util.makeCall(this._api,"/Tools/recompilelibrary/" + id, {});
    }

    /**
     * Recompile the specific Project
     */
    async recompileProject(id){
        return await util.makeCall(this._api,"/Tools/recompileproject/" + id, {});
    }

    /**
     * Recompile the specific Templates folder
     */
    async recompileTemplates(id){
        return await util.makeCall(this._api,"/Tools/recompiletemplates/" + id, {});
    }

}

module.exports = Tools;