const util = require('./util');

/**
 * An object that contains methods for getting information on workflows
 */
class Workflow {

    constructor(api) {
        this.api = api;
    }

    set api(api) {
        this._api = api;
    }

    /**
     * Get a list of all workflows in the cms System Level (does not look at Projects)
     */
    async getList(){
        return await util.makeCall(this._api,"/Workflow/Read",{});
    }

    /**
     * Get information about a specific workflow based on its id
     * @param {number} id - The id of the workflow you want to check 
     */
    async read(id){
        return await util.makeCall(this._api,"/Workflow/Read/" + id, {});
    }

}

module.exports = Workflow;