var Util = require('./Util');
/**
 * An object that contains methods for editing assets in the cms
 * through the API
 */
class AccessAsset {

    constructor(api) {
        this.api = api;
    }

    set api(api) {
        this._api = api;
    }


    /**
     * Move an asset through the workflow
     * @param {ExecuteWorkflowCommandRequest} executeWorkflowCommandRequest - The request containing information on how to move the asset through workflow
     */
    async executeWorkflowCommand(executeWorkflowCommandRequest) {
        var response = await MakeCall.makeCall(this._api, "/Asset/ExecuteWorkflowCommand/", executeWorkflowCommandRequest.toJson());
        return response;
    }

    /**
     * Attach an file to an asset
     * @param {AssetAttachRequest} assetAttachRequest - The request containing information about what to upload
     */
    async attach(assetAttachRequest){
        return await MakeCall.makeCall(this._api,"/Asset/Attach/",assetAttachRequest.toJson());
    }
    
    /**
     * 
     * @param {DownloadAssetsPrepareRequest} DownloadAssetsPrepareRequest - Request containing assetids 
     */
    async DownloadAssetsPrepareString(DownloadAssetsPrepareRequest){
        return await MakeCall.makeCall(this._api,"/Asset/DownloadAssetsPrepare/",DownloadAssetsPrepareRequest.toJson());
    }

     /**
     * 
     * @param {DownloadAssetsPrepareRequest} DownloadAssetsPrepareRequest - Request containing assetids 
     */
    async DownloadAssetsPrepareBuffer(DownloadAssetsPrepareRequest){
        var baseString = await MakeCall.makeCall(this._api,"/Asset/DownloadAssetsPrepare/",DownloadAssetsPrepareRequest.toJson());
        baseString.fileBuffer = Buffer.from(baseString.fileBuffer,'base64');
        return baseString;
    }

    /**
     * Branch an asset. Asset will be in the draft state
     * @param {number} id - The id of the asset to branch 
     */
    async branch(id) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Branch/" + id, {});
        return response;
    }

    /**
     * Create a new asset
     * @param {AssetCreateRequest} assetCreateRequest - The request containing all information needed to create a new asset 
     */
    async createAsset(assetCreateRequest) {
        var response = await MakeCall.makeCall(this._api, "Asset/Create", assetCreateRequest.toJson());
        return response;
    }

    /**
     * Delete an asset with the specified ID
     * @param {number|string} id - The id of the asset to delete from the cms 
     */
    async delete(id) {

        var response = await MakeCall.makeCall(this._api, "Asset/Delete/" + id, "{}");
        return response;
    }

    /**
     * Check if an asset exists in the cms
     * @param {*} idOrPath = The id or path of the asset to check
     */
    async exists(idOrPath) {

        var response = await MakeCall.makeCall(this._api, "Asset/Exists", new AssetExistsRequest(idOrPath).toJson());
        return response;

    }


    /**
     * Get a list of content fields for the specified assets
     * @param {number} id - The id of the asset whose fields are desired 
     */
    async fields(id) {
        var response = await MakeCall.makeCall(this._api, "Asset/Fields/" + id, "{}");
        return response;
    }

    /**
     * Move an asset to a new folder
     * @param {Object} AssetMoveRequest - The request to move the object
     */
    async move(AssetMoveRequest) {
        return await MakeCall.makeCall(this._api, "/Asset/Move/", AssetMoveRequest.toJson());
    }

    /**
     * Returns a list of assets which is filtered by the criteria specified in req.
     * @param {AssetPagedRequest} AssetPagedRequest - Request containing data for request
     */
    async paged(AssetPagedRequest) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Paged/", AssetPagedRequest.toJson());
        return response;
    }

    /**
     * Publishes an asset that does not have workflow
     * @param {AssetPublishRequest} AssetPublishRequest 
     */
    async publish(AssetPublishRequest) {
        return await MakeCall.makeCall(this._api, "/Asset/Publish/", AssetPublishRequest.toJson());
    }

    /**
     * Republishes all assets that are in the given stage
     * @param {AssetPublishRefreshRequest} AssetPublishRefreshRequest 
     */
    async publishRefresh(AssetPublishRefreshRequest) {
        return await MakeCall.makeCall(this._api, "/Asset/PublishRefresh/", AssetPublishRefreshRequest.toJson());
    }

    /**
     * Retrieve a list of information about the provided asset
     * @param {number} id - The id of the asset you want information about 
     */
    async read(id) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Read/" + id, {});
        if (response.asset.is_deleted === null) {
            response.asset.is_deleted = false;
        }
        return response;
    }

    /**
     * Rename an asset
     * @param {AssetRenameRequest} AssetRenameRequest - The request containing the newname and the asset id of the asset
     */
    async rename(AssetRenameRequest) {
        return await MakeCall.makeCall(this._api, "/Asset/Rename/", AssetRenameRequest.toJson());
    }
    /**
     * Route an asset to a specific state
     * @param {Object} AssetRouteRequest 
     */
    async route(AssetRouteRequest) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Route/", AssetRouteRequest.toJson());
        return response;
    }

    /**
     * Undelete an asset that is deleted, does nothing if asset is not deleted
     * @param {number} id - The id of the asset to undelete 
     */
    async undelete(id) {
        return await MakeCall.makeCall(this._api, "/Asset/Undelete/" + id, {});
    }

    /**
     * Update the fields in an asset in the cms
     * @param {AssetUpdateRequest} assetUpdateRequest 
     */
    async update(assetUpdateRequest) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Update/", assetUpdateRequest.toJson());
        return response;
    }
    /**
     * Upload a binary file to the cms
     * @param {AssetUploadRequest} assetUploadRequest - The request containing the information on where to upload
     */
    async upload(assetUploadRequest) {
        var response = await MakeCall.makeCall(this._api, "/Asset/Upload/", assetUploadRequest.toJson());
        return response;
    }

    /**
     * Log a message into the log files, either asset or system
     * @param {number} assetId - The id of the asset to put the message into, is optional. If not set, message is added to system report
     * @param {string} message - The message to log.
     */
    async log(message, assetId=""){
        return await MakeCall.makeCall(this._api,"/Util/Log/",{assetId:assetId,message:message});
    }

    /**
     * Get the sitesummary for the instance
     */
    async siteSummary(){
        return await MakeCall.makeCall(this._api,"/Report/sitesummary/",{});
    }

    
    /**
     * Create a new folder that has models
     * @param {AssetCreateFolderWithModel} assetCreateFolderWithModel - Object containing information to create a folder with model
     */
    async CreateModelWithFolder(assetCreateFolderWithModel){
        return await MakeCall.makeCall(this._api,"/Asset/CreateFolderWithModel",assetCreateFolderWithModel.toJson());
    }


}
/**
 * Class containing the 
 */
class MakeCall {
    /**
     * Function for making call to the cms and return the data async
     * @param {api.api} api - The api to make all calls
     * @param {string} urlPath - The uri path of the request
     * @param {JSON} data - The data being sent in json format
     * @param {function(JSON)} callback - A function to be run on success if desired
     * @param {function(JSON)} onError - A function to run on error
     */
    static async makeCall(api, urlPath, data, callback, onError) {
        var makeCallResponse = new MakeCallResponse();
        await api.postRequest(urlPath, data, function(response) {
                makeCallResponse.parentResponse = response;

                if (callback !== undefined) {
                    callback(response);
                }

            },
            function(error) {
                makeCallResponse.errorMessage = error;

                if (onError !== undefined) {
                    onError(error);
                }
            });

        if (makeCallResponse.errorMessage !== "") { //The code errored out
            throw Error(makeCallResponse.errorMessage.error);
        }

        var response = JSON.parse(makeCallResponse.parentResponse.body)
        response.isSuccessful = (response.resultCode === Util.ResultCode.success);
        return response;
    }
}

/**
 * A container for objects
 */
class MakeCallResponse {

    constructor() {
        this._errorMessage = "";
    }

    set parentResponse(parentResponse) {
        this._parentResponse = parentResponse;
    }

    set errorMessage(errorMessage) {
        this._errorMessage = errorMessage;
    }

    get parentResponse() {
        return this._parentResponse;
    }

    get errorMessage() {
        return this._errorMessage;
    }


}

/**
 * Create a request to move asset to a new location
 */
class AssetMoveRequest {
    /**
     * Create a request to move asset to a new location
     * @param {number} assetId - The Id of the asset to be moved
     * @param {number} destinationFolderId - The id of the folder to move the asset to
     */
    constructor(assetId, destinationFolderId) {
        this._assetId = assetId;
        this._destinationFolderId = destinationFolderId;
    }

    set destinationFolderId(destinationFolderId) {
        this._destinationFolderId = destinationFolderId;
    }

    set assetId(assetId) {
        this._assetId = assetId;
    }

    get destinationFolderId() {
        return this._destinationFolderId;
    }

    get assetId() {
        return this._assetId;
    }

    toJson() {
        return {
            "assetId": this._assetId,
            "destinationFolderId": this._destinationFolderId
        }
    }

}

/**
 * Create a request to execute a workflow move on a provided asset Id
 */
class ExecuteWorkflowCommandRequest {
    /**
     * Create a request to execute a workflow move on a provided asset Id
     * @param {number} assetId - The asset Id of the asset to move through workflow
     * @param {number} commandId - The id of the command to move the asset through workflow
     * @param {boolean} skipDependencies - Set true to skip moving any assets through workflow that are dependent on the given asset or assets this asset depends on
     */
    constructor(assetId, commandId, skipDependencies) {
        this._assetId = assetId;
        this._commandId = commandId;
        this._skipDependencies = skipDependencies;
    }

    set assetId(assetId) {
        this._assetId = assetId;
    }

    set commandId(commandId) {
        this._commandId = commandId;
    }

    set skipDependencies(skipDependencies) {
        this._skipDependencies = skipDependencies;
    }

    get assetId() {
        return this._assetId;
    }

    get commandId() {
        return this._commandId;
    }

    get skipDependencies() {
        return this._skipDependencies;
    }



    toJson() {
        return {
            "assetId": this._assetId,
            "commandId": this._commandId,
            "skipDependencies": this._skipDependencies
        }
    }
}

/**
 * Create a request to publish an asset without a workflow
 */
class AssetPublishRequest {
    /**
     * Create a request to publish an asset without a workflow
     * @param {number[]} assetIds - The asset Id of the asset to move through workflow
     * @param {boolean} skipDependencies - Set true to skip moving any assets through workflow that are dependent on the given asset or assets this asset depends on
     */
    constructor(assetIds, skipDependencies) {
        this._assetIds = assetIds;
        this._skipDependencies = skipDependencies;
    }

    set assetId(assetIds) {
        this._assetIds = assetIds;
    }



    set skipDependencies(skipDependencies) {
        this._skipDependencies = skipDependencies;
    }

    get assetId() {
        return this._assetIds;
    }



    get skipDependencies() {
        return this._skipDependencies;
    }



    toJson() {
        return {
            "assetIds": this._assetIds,
            "skipDependencies": this._skipDependencies
        }
    }
}

/**
 * Create a request for a publishing refresh
 */
class AssetPublishRefreshRequest {
    /**
     * Create a request to publish an asset without a workflow
     * @param {number[]} assetIds - A list of asset Ids to publish
     * @param {number} publishingServerId - The asset Id of the status to move the asset to
     * @param {boolean} skipDependencies - Set true to skip moving any assets through workflow that are dependent on the given asset or assets this asset depends on
     */
    constructor(assetIds, publishingServerId, skipDependencies) {
        this._assetIds = assetIds;
        this._publishingServerId = publishingServerId;
        this._skipDependencies = skipDependencies;
    }

    set assetId(assetIds) {
        this._assetIds = assetIds;
    }

    set publishingServerId(publishingServerId) {
        this._publishingServerId = publishingServerId;
    }

    set skipDependencies(skipDependencies) {
        this._skipDependencies = skipDependencies;
    }

    get assetId() {
        return this._assetIds;
    }

    get publishingServerId() {
        return this._publishingServerId;
    }


    get skipDependencies() {
        return this._skipDependencies;
    }



    toJson() {
        return {
            "assetIds": this._assetIds,
            "publishingServerId": this._publishingServerId,
            "skipDependencies": this._skipDependencies
        }
    }
}



/**
 * Create a request to check if asset exists, either by ID or path
 */
class AssetExistsRequest {
    /**
     * Create the AssetExistsRequest
     * @param {String} assetIdOrPath - The asset ID or Path of the asset to check if it exists
     */
    constructor(assetIdOrPath) {
        this.assetIdOrPath = assetIdOrPath;
    }

    set assetIdOrPath(assetIdOrPath) {
        this._assetIdOrPath = assetIdOrPath;
    }

    toJson() {
        return {
            assetIdOrPath: this._assetIdOrPath
        };

    }
}


/** Class for creating a new Update Request */
class AssetUpdateRequest {
    /**
     * Create an Update Request
     * @param {number} assetId - The asset id to update
     * @param {JSON} fields - The fields to update in a JSON format {"key":"value","key":"value",...}
     * @param {Array} fieldsToDelete - The fields to delete in a list format ["key","key",...]
     * @param {boolen} runPostInput - Run the post input on update
     * @param {boolean} runPostSave - Run the post save on update
     */
    constructor(assetId, fields, fieldsToDelete,runPostInput = false,runPostSave=false ) {
        this._assetId = assetId;
        this._fields = fields;
        this._fieldsToDelete = fieldsToDelete;
       
        this._runPostInput = runPostInput;
        this._runPostSave =  runPostSave;
    }


    set assetId(assetId) {
        this._assetId = assetId;
    }

    set fields(fields) {
        this._fields = fields;
    }

    set newName(fieldsToDelete) {
        this._fieldsToDelete = fieldsToDelete;
    }

    set runPostInput(value){
        this._runPostInput = value;
    }

    set runPostSave(value){
        this._runPostSave = value;
    }

    toJson() {
        return {
            "assetId": this._assetId,
            "fields": this._fields,
            "fieldsToDelete": this._fieldsToDelete,
            "runPostInput":this._runPostInput,
            "runPostSave":this._runPostSave
        };
    }

}

/**
 * Request for uploading an asset to the cms
 */
class AssetUploadRequest {
    /**
     * Create a new Asset Upload
     * @param {string} bytes -The file to upload as a base64 string
     * @param {number} destinationFolderId - The id of the folder to upload to
     * @param {number} modelId - The id of the model if desired
     * @param {string} newName - The name of the new file
     * @param {number} workflowId - The id of the workflow desired
     */
    constructor(bytes, destinationFolderId, modelId, newName, workflowId) {
        this._bytes = bytes;
        this._destinationFolderId = destinationFolderId;
        this._modelId = modelId;
        this._newName = newName;
        this._workflowId = workflowId;
    }

    set bytes(bytes) {
        this._bytes = bytes;
    }

    set destinationFolderId(destinationFolderId) {
        this._destinationFolderId = destinationFolderId;
    }

    set modelId(modelId) {
        this._modelId = modelId;
    }

    set newName(newName) {
        this._newName = newName;
    }

    set workflowId(workflowId) {
        this._workflowId = workflowId;
    }

    toJson() {
        var json = {
            "bytes": this._bytes,
            "destinationFolderId": this._destinationFolderId,
            "newName": this._newName,
            "workflowId": this._workflowId
        };

        if (!isNaN(this._modelId)) {
            json.modelId = this._modelId;
        } else {
            json.modelId = -1;
        }

        return json;
    }
}

class AssetCreateFolderWithModelRequest {
    /**
     * 
     * @param {String} newName - Desired name of the folder 
     * @param {int} destinationFolderId - The id of the folder to place the folder in
     * @param {int} modelId - The id of the model 
     */
    constructor(newName,destinationFolderId,modelId){
        this._newName = newName;
        this._destinationFolderId = destinationFolderId;
        this._modelId = modelId;
    }

    /**
     * @param {string} newName - The name of the new asset
     */
    set newName(newName) {
        this._newName = newName;
    }


    /**
     * @param {number} destinationFolderId -The Destination folder to place it in
     */
    set destinationFolderId(destinationFolderId) {
        this._destinationFolderId = destinationFolderId;
    }

    /**
     * @param {string} modelId - The model id of the desired model for the folder
     */
    set modelId(modelId) {
        this._modelId = newName;
    }

    toJson(){
        return {
            "newName":this._newName,
            "destinationFolderId":this._destinationFolderId,
            "modelId": this._modelId
        }
    }
}

/**
 * 
 */
class AssetCreateRequest {

    /**
     * Create a new request to create an asset
     * @param {string} newName - The name of the new asset
     * @param {number} destinationFolderId - The folder to put the asset into
     * @param {number} modelId - The id of the model, leave empty if you do not want a model
     * @param {number} type - The type of asset to create: None: 0, File: 2, Folder: 4, Mount: 9, Connector: 10
     * @param {number} devTemplateLanguage - The language of the developer template
     * @param {number} templateId - The id of the template if desired
     * @param {number} workflowId - The desired workfow of the asset
     * @param {number} subtype - (Look it up)
     */
    constructor(newName, destinationFolderId, modelId, type, devTemplateLanguage, templateId, workflowId, subtype = null) {
        this.newName = newName;
        this.destinationFolderId = destinationFolderId;
        this.modelId = modelId;
        this.type = type;
        this._devTemplateLanguage = devTemplateLanguage;
        this._templateId = templateId;
        this._workflowId = workflowId;
        this._subtype = subtype;
    }

    /**
     * @param {string} newName - The name of the new asset
     */
    set newName(newName) {
        this._newName = newName;
    }


    /**
     * @param {number} destinationFolderId -The Destination folder to place it in
     */
    set destinationFolderId(destinationFolderId) {
        this._destinationFolderId = destinationFolderId;
    }




    /**
     * @param {number} devTemplateLanguage - The language to be set for the asset
     */
    set devTemplateLanguage(devTemplateLanguage) {
        this._devTemplateLanguage = devTemplateLanguage;
    }

    //
    /**
     * @param {number} modelId - The Id of the model
     */
    set modelId(modelId) {
        this._modelId = modelId;
    }

    /**
     * @param {number} subtype - The subtype of the asset
     */
    set subtype(subtype) {
        this._subtype = subtype;
    }


    /**
     * @param {number} templateId - The id of the template to set
     */
    set templateId(templateId) {
        this._templateId = templateId;
    }

    /**
     * @param {number} type - The type of asset to create: None: 0, File: 2, Folder: 4, Mount: 9, Connector: 10
     */
    set type(type) {
        this._type = type;
    }

    /**
     * @param {number} workflowId - The id of the workflow to set
     */
    set workflowId(workflowId) {
        this._workflowId = workflowId;
    }

    /**
     * Return the object as a json
     */
    toJson() {
        return {
            "destinationFolderId": this._destinationFolderId,

            "devTemplateLanguage": this._devTemplateLanguage,

            "modelId": this._modelId,

            "newName": this._newName,

            "subtype": this._subtype,

            "templateId": this._templateId,

            "type": this._type,

            "workflowId": this._workflowId,

        }
    }

}

class AssetPagedRequest {
    /**
     * Create an instance of the AssetPagedRequest for getting lists of assets
     * @param {number} assetId - The assetId of the folder to get the list of assets from
     * @param {number} assetIdToFindPage - Unsure, find out
     * @param {number} currentPage - The current page number, if greater than the max returns (TODO find out)
     * @param {boolean} ignoreFilter - TODO Find Out (Ignore the currently set filter)
     * @param {boolean} ignoreSort - TODO Find Out (Ignore the current set Sort)
     * @param {Util.OrderType} orderType - Change the order of how the paged values will be returned (Ascending:0, Descending:1, NotSet:2, Saved:3) //TODO find out what NotSet and Saved do
     * @param {number} pageSize - Number of assets to return on each page
     * @param {boolean} saveSort - TODO find out
     * @param {string} sortColumn - TODO find out
     * @param {Util.VisibilityType} visibilityType - Display Hidden:1, Deleted:2, Or Normal:0 
     */
    constructor(assetId, assetIdToFindPage, currentPage, ignoreFilter, ignoreSort, orderType, pageSize, saveSort, sortColumn, visibilityType) {
        this._assetId = assetId;
        this._assetIdToFindPage = assetIdToFindPage;
        this._currentPage = currentPage;
        this._ignoreFilter = ignoreFilter;
        this._ignoreSort = ignoreSort;
        this._orderType = orderType;
        this._pageSize = pageSize;
        this._saveSort = saveSort;
        this._sortColumn = sortColumn;
        this._visibilityType = visibilityType;
    }

    set assetId(assetId) {
        this._assetId = assetId;
    }
    set assetIdToFindPage(assetIdToFindPage) {
        this._assetIdToFindPage = assetIdToFindPage;
    }
    set currentPage(currentPage) {
        this._currentPage = currentPage;
    }
    set ignoreFilter(ignoreFilter) {
        this._ignoreFilter = ignoreFilter;
    }
    set ignoreSort(ignoreSort) {
        this._ignoreSort = ignoreSort;
    }
    set orderType(orderType) {
        this._orderType = orderType;
    }
    set pageSize(pageSize) {
        this._pageSize = pageSize;
    }
    set saveSort(saveSort) {
        this._saveSort = saveSort;
    }
    set sortColumn(sortColumn) {
        this._sortColumn = sortColumn;
    }
    set visibilityType(visibilityType) {
        this._visibilityType = visibilityType;
    }

    toJson() {
        return {
            "assetId": this._assetId,
            "assetIdToFindPage": this._assetIdToFindPage,
            "currentPage": this._currentPage,
            "ignoreFilter": this._ignoreFilter,
            "ignoreSort": this._ignoreSort,
            "orderType": this._orderType,
            "pageSize": this._pageSize,
            "saveSort": this._saveSort,
            "sortColumn": this._sortColumn,
            "visibilityType": this._visibilityType
        }
    }
}

/**
 * Class for creating route requests
 */
class AssetRouteRequest {
    /**
     * Create a RouteRequest Object
     * @param {number} assetId - The id of the asset to route to the provide state
     * @param {number} stateId - The id of the state to move the asset to (this is specific to each workflow)
     */
    constructor(assetId, stateId) {
        this._assetId = assetId;
        this._stateId = stateId;
    }

    set assetId(assetId) {
        this._assetId = assetId;
    }

    set stateId(stateId) {
        this._stateId = stateId;
    }

    get assetId() {
        return this._assetId;
    }

    get stateId() {
        return this._stateId;
    }

    toJson() {
        return {
            assetId: this._assetId,
            stateId: this._stateId
        }
    }

}

/**
 * Create an Asset Rename Request
 */
class AssetRenameRequest {
    /**
     * Create an Asset Rename Request
     * @param {number} assetId - The id of the asset to rename
     * @param {string} newName - The new name of the asset 
     */
    constructor(assetId, newName) {
        this._assetId = assetId;
        this._newName = newName;
    }

    set assetId(assetId) {
        this._assetId = assetId;
    }

    set newName(newName) {
        this._newName = newName;
    }

    get assetId() {
        return this._assetId;
    }

    get newName() {
        return this._newName;
    }

    toJson() {
        return {
            "assetId": this._assetId,
            "newName": this._newName
        }
    }



}

class AssetAttachRequest {
    /**
     * Create an AssetAttachRequest 
     * @param {number} assetId - The id of the asset to attach this to
     * @param {string} bytes - -The file to upload as a base64 string
     * @param {string} originalFilename - The name of the file
     */
    constructor(assetId, bytes, originalFilename) {
        this._assetId = assetId;
        this._bytes = bytes;
        this._originalFilename = originalFilename;
    }

    set bytes(bytes){
        this._bytes = bytes;
    }

    set assetId(assetId){
        this._assetId = assetId;
    }

    set originalFilename(originalFilename){
        this._originalFilename = originalFilename;
    }

    get assetId(){
        return this._assetId;
    }

    get bytes(){
        return this._bytes;
    }

    get originalFilename(){
        return this._originalFilename;
    }

    toJson() {
        return {
            "assetId": this._assetId,
            "bytes": this._bytes,
            "originalFilename": this._originalFilename
        }
    }
}
 /**
     * 
     * @param {int[]} assetIds - List of asset ids
     */
class DownloadAssetsPrepareRequest {
    /**
     * 
     * @param {int[]} assetIds - List of asset ids
     */
    constructor(assetIds){
        if(Array.isArray(assetIds)){
            this._assetIds = assetIds;
        }else{
            this._assetIds = [assetIds];
        }
    }

    set assetIds(assetIds){
        if(Array.isArray(assetIds)){
            this._assetIds = assetIds;
        }else{
            this._assetIds = [assetIds];
        }
    }

    toJson(){
        return {
            "AssetIds": this._assetIds
        }
    }
}


module.exports = {
    AccessAsset: AccessAsset,
    AssetCreateRequest: AssetCreateRequest,
    AssetExistsRequest: AssetExistsRequest,
    AssetUpdateRequest: AssetUpdateRequest,
    AssetUploadRequest: AssetUploadRequest,
    AssetPagedRequest: AssetPagedRequest,
    AssetRouteRequest: AssetRouteRequest,
    ExecuteWorkflowCommandRequest: ExecuteWorkflowCommandRequest,
    AssetMoveRequest: AssetMoveRequest,
    AssetPublishRequest: AssetPublishRequest,
    AssetPublishRefreshRequest: AssetPublishRefreshRequest,
    AssetRenameRequest: AssetRenameRequest,
    AssetAttachRequest:AssetAttachRequest,
    DownloadAssetsPrepareRequest:DownloadAssetsPrepareRequest,
    MakeCall: MakeCall
}