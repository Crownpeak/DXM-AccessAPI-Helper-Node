//@ts-check
const Util = require("./util");

const VERSIONS_PAGE_SIZE = 50;
// Safety net on the paging loop in allVersions(). totalCount is not reliable enough to compute a
// page count from (see the versions() notes), so we page until exhaustion instead.
const MAX_VERSION_PAGES = 100;

/**
 * The CMS pads the last page of version history with a sentinel row whose versionId is -1. It is
 * not a version and has no content, so it is stripped before the response reaches the caller.
 * @param {object} response - a response from /AssetProperties/Versions/
 */
function stripVersionSentinels(response) {
    if (Array.isArray(response.assetVersions)) {
        response.assetVersions = response.assetVersions.filter(v => v.versionId !== -1);
    }
    return response;
}

/**
 * An object that contains methods for managing properties of assets in the cms, essentially
 * anything that could be done through the Properties panel in the CMS UI.
 */
class AccessAssetProperties {

    constructor(api) {
        this._api = api;
    }    

    /**
     * @param {number} assetId      the asset ID to fetch the attachments for
     */
    async attachments(assetId) {
        let request = {
            "assetId" : assetId
        };
        return await Util.makeCall(this._api, "/AssetProperties/Attachments/", request);
    }

    /**
     * Retrieve site root details for an asset
     * @param {number} assetId      the id of the asset you want site root details about
     */
    async readSiteRoot(assetId) {
        let request = {
            "assetId" : assetId
        };
        return await Util.makeCall(this._api, "/AssetProperties/ReadSiteRoot", request);
    }

    /**
     * Retrieve one page of the version history of an asset.
     *
     * Three quirks of this endpoint, all verified against a live instance - don't "tidy" them away:
     * - Pages are 1-based. currentPage 0 returns an empty assetVersions array *with*
     *   resultCode conWS_Success, so a 0-based loop looks exactly like "no version history".
     * - The last page is padded with a sentinel row whose versionId is -1; those rows are
     *   filtered out of the response here.
     * - totalCount disagrees with the real number of rows depending on pageSize (6 vs 5 observed
     *   for the same asset), so don't use it to work out how many pages there are - page until a
     *   page comes back short, or use allVersions().
     *
     * In each returned row note that the field really is `modified_On` (capital O), and that
     * `name` is the user who made the change, not the name of the asset.
     *
     * @param {number} assetId          the id of the asset to read the version history of
     * @param {number=} currentPage     the 1-based page to read (defaults to 1)
     * @param {number=} pageSize        the number of versions per page (defaults to 50)
     */
    async versions(assetId, currentPage = 1, pageSize = VERSIONS_PAGE_SIZE) {
        let request = {
            "assetId": assetId,
            "currentPage": currentPage,
            "pageSize": pageSize
        };
        let response = await Util.makeCall(this._api, "/AssetProperties/Versions/", request);
        return stripVersionSentinels(response);
    }

    /**
     * Retrieve the complete version history of an asset, paging through /AssetProperties/Versions/
     * until a short page is returned. The response is shaped like a single versions() response -
     * test isSuccessful, then read assetVersions - but totalCount is dropped, because the value the
     * CMS reports there cannot be trusted (see versions()).
     *
     * @param {number} assetId          the id of the asset to read the version history of
     * @param {number=} pageSize        the number of versions to request per call (defaults to 50)
     */
    async allVersions(assetId, pageSize = VERSIONS_PAGE_SIZE) {
        let assetVersions = [];
        let response;
        for (let page = 1; page <= MAX_VERSION_PAGES; page++) {
            response = await this.versions(assetId, page, pageSize);
            if (!response.isSuccessful) {
                return response;
            }
            let rows = response.assetVersions || [];
            assetVersions.push(...rows);
            // Short page means we are done. Note this counts real rows, after the -1 sentinel row
            // on the final page has been stripped.
            if (rows.length < pageSize) {
                break;
            }
        }
        response.assetVersions = assetVersions;
        delete response.totalCount;
        return response;
    }

    /**
     * Retrieve the field content of a specific version of an asset.
     *
     * The CMS silently ignores a versionId the asset has never had: it returns the asset's
     * *current* content with resultCode conWS_Success, so the caller gets the wrong data with no
     * indication that anything went wrong. By default this function therefore reads the version
     * history first and fails with an errorMessage if the requested version isn't in it. Pass
     * validate = false to skip that extra round trip when the id is already known to be good.
     *
     * @param {number} assetId          the id of the asset to read
     * @param {number} versionId        the id of the version to read
     * @param {boolean=} validate       check the version exists first (defaults to true)
     */
    async versionContent(assetId, versionId, validate = true) {
        if (validate) {
            let invalid = await this._rejectUnknownVersion(assetId, versionId);
            if (invalid) {
                return invalid;
            }
        }
        let request = {
            "assetId": assetId,
            "versionId": versionId
        };
        return await Util.makeCall(this._api, "/AssetProperties/Versions/Content", request);
    }

    /**
     * Restore an asset to a previous version. Reverting does not rewrite history - it appends a new
     * version whose content is the old one's - so the content being replaced stays recoverable, and
     * the response carries the id of the version that was created.
     *
     * The endpoint is /Asset/RevertToVersion, but it lives on this controller with the rest of the
     * version family; it shares their validation and callers think of it as version management.
     *
     * As with versionContent, the version is looked up first by default - here a bad id would mean
     * a bad *write* rather than a bad read.
     *
     * @param {number} assetId          the id of the asset to revert
     * @param {number} versionId        the id of the version to revert the asset to
     * @param {boolean=} validate       check the version exists first (defaults to true)
     * @param {boolean=} isConfirmed    the CMS confirmation flag (defaults to true, which performs
     *                                  the revert). The API also accepts false, but what that
     *                                  returns has not been verified against a live instance.
     */
    async revertToVersion(assetId, versionId, validate = true, isConfirmed = true) {
        if (validate) {
            let invalid = await this._rejectUnknownVersion(assetId, versionId);
            if (invalid) {
                return invalid;
            }
        }
        let request = {
            "assetId": assetId,
            "versionId": versionId,
            "isConfirmed": isConfirmed
        };
        let response = await Util.makeCall(this._api, "/Asset/RevertToVersion", request);
        // Swagger declares this field as PascalCase NewVersionId while every other response in the
        // version family arrives camelCase; which one the wire actually uses is untested, so
        // normalise rather than have callers read undefined.
        if (response.newVersionId === undefined && response.NewVersionId !== undefined) {
            response.newVersionId = response.NewVersionId;
        }
        return response;
    }

    /**
     * Returns a failed response if versionId is not in the asset's history, or null if it is.
     * @param {number} assetId
     * @param {number} versionId
     */
    async _rejectUnknownVersion(assetId, versionId) {
        let history = await this.allVersions(assetId);
        if (!history.isSuccessful) {
            return history;
        }
        let versions = history.assetVersions || [];
        if (versions.some(v => v.versionId === versionId)) {
            return null;
        }
        let known = versions.map(v => v.versionId).join(", ") || "none";
        return {
            "resultCode": "",
            "errorMessage": `Version ${versionId} not found on asset ${assetId}. Known version IDs: ${known}`,
            "internalCode": 0,
            "isSuccessful": false
        };
    }

    /**
     * @param {number[]} assetIds                         an array of the asset IDs to associate the given model ID with
     * @param {number} modelId                            the id of the model to 
     */
     async setModel(assetIds, modelId) {
        let request = {
            "assetIds" : assetIds,
            "modelId": modelId
        };
        return await Util.makeCall(this._api, "/AssetProperties/SetModel/", request);
    }

    /**
     * @param {number[]} assetIds                            an array of the asset IDs to associate the given template ID with
     * @param {number} templateId                            the id of the template to associate. This value is ignored if isDeveloperTemplate param is true
     * @param {boolean=} isDeveloperTemplate                 use the special purpose developer template (defaults to false)
     * @param {Util.TemplateLanguageType=} templateLanguage  legacy support to specify the template language (defaults to TemplateLanguageType.CSharp)
     */
    async setTemplate(assetIds, templateId, isDeveloperTemplate=false, templateLanguage=Util.TemplateLanguageType.CSharp) {
        let request = {
            "assetIds" : assetIds,
            "templateId": templateId,
            "isDeveloperTemplate": isDeveloperTemplate,
            "templateLanguage": templateLanguage
        };
        return await Util.makeCall(this._api, "/AssetProperties/SetTemplate/", request);
    }

    /**
     * @param {number[]} assetIds                            an array of the asset IDs to associate the given template ID with
     * @param {number} workflowId                            the id of the template to associate. This value is ignored if isDeveloperTemplate param is true
     */
    async setWorkflow(assetIds, workflowId) {
        let request = {
            "assetIds" : assetIds,
            "workflowId": workflowId,
        };
        return await Util.makeCall(this._api, "/AssetProperties/SetWOrkflow/", request);
    }    

}

module.exports = AccessAssetProperties;