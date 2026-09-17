<a href="https://www.crownpeak.com" target="_blank">![Crownpeak Logo](https://raw.githubusercontent.com/Crownpeak/DXM-AccessAPI-Helper-Node/master/images/crownpeak-logo.png?raw=true "Crownpeak Logo")</a>

# Crownpeak Digital Experience Management (DXM) Access API Helper for Node
Crownpeak Digital Experience Management (DXM) Access API Helper for Node has been constructed to assist
in developing client-side applications that leverage DXM for content management purposes.

## Usage

Installation instructions:

```javascript
npm i crownpeak-dxm-accessapi-helper --save-dev

or 

yarn add crownpeak-dxm-accessapi-helper
```

In your application, make a reference to the API class:

```javascript
const CrownpeakApi = require('crownpeak-dxm-accessapi-helper');
const crownpeak = new CrownpeakApi();
```

See <a href="https://developer.crownpeak.com/Documentation/AccessAPI/index.html" target="_blank">https://developer.crownpeak.com/Documentation/AccessAPI/index.html</a> for a full guide to using the Crownpeak DXM Access API.

### Logging in

Before you are able to call any functions within the Access API, you must first login to your CMS instance.

```javascript
crownpeak.login(
    "username",
    "password",
    "cms.crownpeak.net",
    "cms-instance",
    "api-key"
);
```

### Re-using an existing session

If you already have session cookies (for example, captured from a browser-driven login), you can pre-populate the helper with ```setSession``` and skip the password POST entirely:

```javascript
crownpeak.setSession({
    host: "cms.crownpeak.net",
    instance: "cms-instance",
    apiKey: "api-key",
    cookie: [/* array of "name=value; Path=/; ..." strings, same shape as set-cookie-parser.splitCookiesString output */]
});
```

All four fields are required; the call throws if any is missing. Subsequent function calls use the supplied cookie and API key the same way they would after a normal ```login()```.

To discard the stored session:

```javascript
crownpeak.clearSession();
```

---

### Asset functions

#### Example

Some functions take simple parameters, such as an asset id, whereas others require a Request object to be created. For example, to create an asset, use the ```CreateRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateRequest(
    name, 
    destinationFolderId,
    modelId,
    type, // 2 for a file, or 4 for a folder, see crownpeak.Util.AssetType
    devTemplateLanguage,
    templateId,
    workflowId,
    subtype // see crownpeak.Util.AssetSubType
);
```

Once created, pass this request to the appropriate function:

```javascript
let response = await crownpeak.Asset.create(request);
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

For asset functions, commonly an ```asset``` will also be returned, for example:

```javascript
{
    "asset": {
        "id": 12345,
        "label": "My Test Asset",
        "type": 2,
        "folder_id": 1234,
        // [...]
    }
}
```

#### Attach a file to an asset

To attach a digital file to a templated asset, use the ```attach``` function:

```javascript
const request = new crownpeak.AccessAsset.AttachRequest(
    assetId,
    bytes, // Base64-encoded string containing the file contents
    originalFilename
);
let response = await crownpeak.Asset.attach(request);
```

#### Branch

To branch an asset, use the ```branch``` function:

```javascript
let response = await crownpeak.Asset.branch(assetId);
```

#### Create

To create an asset, use the ```create``` function, passing in an instance of the ```Asset.CreateRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateRequest(
    name, 
    destinationFolderId,
    modelId,
    type, // 2 for a file, or 4 for a folder, see crownpeak.Util.AssetType
    devTemplateLanguage,
    templateId,
    workflowId,
    subtype
);
let response = await crownpeak.Asset.create(request);
```

#### Create a folder with a model

To create a folder with a model, use the ```createFolderWithModel``` function, passing in an instance of the ```Asset.CreateFolderWithModelRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateFolderWithModelRequest(
    name, 
    destinationFolderId,
    modelId
);
let response = await crownpeak.Asset.createFolderWithModel(request);
```

#### Create a library reference

To create a library reference, use the ```createLibraryReference``` function, passing in an instance of the ```Asset.CreateLibraryReferenceRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateLibraryReferenceRequest(
    name, 
    destinationFolderId,
    libraryId
);
let response = await crownpeak.Asset.createLibraryReference(request);
```

#### Create a project

To create a project, use the ```createProject``` function, passing in an instance of the ```Asset.CreateProjectRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateProjectRequest(
    name, 
    destinationFolderId,
    libraryName,              // optional
    installComponentLibrary,
    componentLibraryVersion,  // "2.1"
    rebuildSite
);
let response = await crownpeak.Asset.createProject(request);
```

#### Create a site root

To create a project, use the ```createSiteRoot``` function, passing in an instance of the ```Asset.CreateSiteRootRequest``` class:

```javascript
const request = new crownpeak.Asset.CreateSiteRootRequest(
    name, 
    destinationFolderId,
    installCL,
    rebuildCL,
    versionCL            // "2.1"
);
let response = await crownpeak.Asset.createSiteRoot(request);
```

Note that a site root cannot be created as a descendant of another site root.

#### Download an asset as a Buffer

To download an asset into a Buffer, use the ```downloadAsBuffer``` function, passing in an instance of the ```Asset.DownloadPrepareRequest``` class:

```javascript
const request = new crownpeak.Asset.DownloadPrepareRequest(
    assetIds // array of ints
);
let response = await crownpeak.Asset.downloadAsBuffer(request);
```

#### Download an asset as a string

To download an asset into a string, use the ```downloadAsString``` function, passing in an instance of the ```Asset.DownloadPrepareRequest``` class:

```javascript
const request = new crownpeak.Asset.DownloadPrepareRequest(
    assetIds // array of ints
);
let response = await crownpeak.Asset.downloadAsString(request);
```

#### Download a file attached to an asset as a Buffer

To download a file attached to an asset into a Buffer, use the ```downloadAttachmentAsBuffer``` function, passing in a string containing the attachment path, which can be found in the ```previewUrl``` property of attachments returned from calls to ```AssetProperties.attachments```:

```javascript
let response = await crownpeak.Asset.downloadAttachmentAsBuffer(path);
```

#### Download a file attached to an asset as a string

To download a file attached to an asset into a string, use the ```downloadAttachmentAsString``` function, passing in a string containing the attachment path, which can be found in the ```previewUrl``` property of attachments returned from calls to ```AssetProperties.attachments```:

```javascript
let response = await crownpeak.Asset.downloadAttachmentAsString(path, optionalEncoding);
```

#### Delete

To delete an asset, use the ```delete``` function:

```javascript
let response = await crownpeak.Asset.delete(assetId);
```

#### Execute a workflow command

To execute a workflow command on an asset, use the ```executeWorkflowCommand``` function, passing in an instance of the ```Asset.ExecuteWorkflowCommandRequest``` class:

```javascript
const request = new crownpeak.Asset.ExecuteWorkflowCommandRequest(
    assetId,
    commandId,
    skipDependencies
);
let response = await crownpeak.Asset.executeWorkflowCommand(request);
```

#### Exists

To test if an asset exists, use the ```exists``` function:

```javascript
let response = await crownpeak.Asset.exists(assetIdOrPath);
```

#### Fields

To retrieve the fields and values for an asset, use the ```fields``` function:

```javascript
let response = await crownpeak.Asset.fields(assetId);
```

#### Log

To store a message on the Audit log, use the ```log``` function:

```javascript
let response = await crownpeak.Asset.log(log, optionalAssetId);
```

If an asset id is provided, the log entry will be created against that specific asset.

#### Move

To move an asset to a different parent folder, use the ```move``` function, passing in an instance of the ```Asset.MoveRequest``` class:

```javascript
const request = new crownpeak.Asset.MoveRequest(
    assetId,
    destinationFolderId
);
let response = await crownpeak.Asset.move(request);
```

#### Paged list of children

To fetch the child assets contained within a folder, use the ```paged``` function, passing in an instance of the ```Asset.PagedRequest``` class:

```javascript
const request = new crownpeak.Asset.PagedRequest(
    assetId,
    assetIdToFindPage, // Leave blank if you're not looking for a particular asset
    currentPage,       // 0-based page index
    ignoreFilter,
    ignoreSort,
    orderType,         // See crownpeak.Util.OrderType
    number,            // the number of records to fetch on each page
    saveSort,          // TODO
    sortColumn,        // The column name to sort by
    visibilityType,    // See crownpeak.Util.VisibilityType
    filter             // A filter object to be used - optional
);
let response = await crownpeak.Asset.paged(request);
```

#### Preview

To get the preview HTML for an asset, as though running inside DXM, use the ```preview``` function:

```javascript
let response = await crownpeak.Asset.preview(request);
```

#### Publish

To publish an asset that is not in workflow, use the ```publish``` function, passing in an instance of the ```Asset.PublishRequest``` class:

```javascript
const request = new crownpeak.Asset.PublishRequest(
    assetIds, // array of ints
    skipDependencies
);
let response = await crownpeak.Asset.publish(request);
```

#### Publish refresh

To refresh the publishing for a folder, use the ```publishRefresh``` function, passing in an instance of the ```Asset.PublishRefreshRequest``` class:

```javascript
const request = new crownpeak.Asset.PublishRefreshRequest(
    assetIds,           // array of ints
    publishingServerId, // the id of the publishing package to refresh
    skipDependencies
);
let response = await crownpeak.Asset.publishRefresh(request);
```

#### Read

To read information about an asset, use the ```read``` function:

```javascript
let response = await crownpeak.Asset.read(assetId);
```

#### Rename

To rename an asset, use the ```rename``` function, passing in an instance of the ```Asset.RenameRequest``` class:

```javascript
const request = new crownpeak.Asset.RenameRequest(
    assetId,
    newName
);
let response = await crownpeak.Asset.rename(request);
```

#### Route

To route an asset to a particular workflow state, use the ```route``` function, passing in an instance of the ```Asset.RouteRequest``` class:

```javascript
const request = new crownpeak.Asset.RouteRequest(
    assetId,
    stateId // the id of the state required, found in /System/States
);
let response = await crownpeak.Asset.route(request);
```

#### Undelete

To undelete an asset, use the ```undelete``` function:

```javascript
let response = await crownpeak.Asset.undelete(assetId);
```

#### Update

To update the fields and values for an asset, use the ```update``` function, passing in an instance of the ```Asset.UpdateRequest``` class:

```javascript
const request = new crownpeak.Asset.UpdateRequest(
    assetId,
    fields,         // json object containing fields and values
    fieldsToDelete, // array of strings containing field names
    runPostInput,
    runPostSave
);
let response = await crownpeak.Asset.update(request);
```

#### Upload

To upload a binary file to a new digital asset, use the ```upload``` function, passing in an instance of the ```Asset.UploadRequest``` class:

```javascript
const request = new crownpeak.Asset.UploadRequest(
    bytes, // Base64-encoded string containing the file contents
    destinationFolderId,
    modelId,
    name,
    workflowId
);
let response = await crownpeak.Asset.upload(request);
```

#### View Output

To get the output HTML for an asset, as though during publishing, use the ```viewOutput``` function:

```javascript
let response = await crownpeak.Asset.viewOutput(request);
```

---

### Asset Properties functions

#### Example

All asset properties functions take simple parameters or none at all.

```javascript
let response = await crownpeak.AssetProperties.setWorkflow([123], 0);
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

#### Attachments

To get the attachments for an asset, use the ```attachments``` function:

```javascript
let response = await crownpeak.AssetProperties.attachments(
    asset_id,     // the asset id to fetch the attachments for
);
```

#### Versions

To read a single page of an asset's version history, use the ```versions``` function:

```javascript
let response = await crownpeak.AssetProperties.versions(
    asset_id,     // the asset id to read the version history of
    currentPage,  // the page to read - pages are 1-based (optional, defaults to 1)
    pageSize      // the number of versions per page (optional, defaults to 50)
);
```

Three things to know about the underlying endpoint:

* Pages are 1-based. Asking for page 0 returns an empty ```assetVersions``` array with a *successful* result code, which looks exactly like an asset with no history.
* The last page is padded with a sentinel row whose ```versionId``` is ```-1```. The helper filters those rows out for you.
* The ```totalCount``` in the response disagrees with the actual number of versions depending on the page size, so don't use it to work out how many pages to ask for. Read until a page comes back with fewer rows than ```pageSize```, or use ```allVersions``` below.

In each row, note that the field is ```modified_On``` (with a capital O), and that ```name``` is the user who made the change, not the name of the asset.

To read the whole history in one call, use the ```allVersions``` function, which pages until the history is exhausted. The response looks like a ```versions``` response with every version in ```assetVersions```, except that the unreliable ```totalCount``` is omitted:

```javascript
let response = await crownpeak.AssetProperties.allVersions(
    asset_id,     // the asset id to read the version history of
    pageSize      // the number of versions to request per call (optional, defaults to 50)
);
```

To read the field content of a particular version, use the ```versionContent``` function:

```javascript
let response = await crownpeak.AssetProperties.versionContent(
    asset_id,     // the asset id to read
    versionId,    // the version id to read
    validate      // check the version exists first (optional, defaults to true)
);
```

The fields are returned in the ```content``` array, in the same shape as ```Asset.fields```.

Given a ```versionId``` the asset has never had, the CMS returns the asset's *current* content with a successful result code rather than an error. To stop that quietly passing off the wrong data as a version, the helper reads the history first and returns an unsuccessful response if the version isn't in it. Pass ```validate``` as ```false``` to skip that extra round trip when you already know the id is good.

#### Revert To Version

To restore an asset to an earlier version, use the ```revertToVersion``` function:

```javascript
let response = await crownpeak.AssetProperties.revertToVersion(
    asset_id,     // the asset id to revert
    versionId,    // the version id to revert the asset to
    validate,     // check the version exists first (optional, defaults to true)
    isConfirmed   // the CMS confirmation flag (optional, defaults to true)
);
```

Reverting does not rewrite history - it appends a new version whose content is the old one's - so the content being replaced remains recoverable. The id of the newly created version is returned in ```newVersionId```.

```validate``` works as it does for ```versionContent```, and matters more here, because a bad version id would mean a bad write rather than a bad read. ```isConfirmed``` defaults to ```true```, which performs the revert; the API also accepts ```false```, but what that does has not been verified.

#### Set Template

To set the template details for one or more assets, use the ```setTemplate``` function:

```javascript
let response = await crownpeak.AssetProperties.setTemplate(
    [asset_ids ...],     // array of asset ids to set the template for
    templateId,          // the template id to set for the assets
    isDeveloperTemplate // true if this is a DeveloperCS template, or false if not
);
```

#### Set Workflow

To set the workflow details for one or more assets, use the ```setWorkflow``` function:

```javascript
let response = await crownpeak.AssetProperties.setWorkflow(
    [asset_ids ...],     // array of asset ids to set the workflow for
    workflowId           // the workflow id to set for the assets
);
```

---

### Report functions

#### Example

All report functions take simple parameters or none at all.

```javascript
let response = await crownpeak.Report.siteSummary();
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

For report functions, commonly a ```reportData``` object will also be returned, for example:

```javascript
{
    "reportData": {
        // [...]
    }
}
```

#### Site Summary

To read a site summary report from the CMS, use the ```siteSummary``` function:

```javascript
let response = await crownpeak.Report.siteSummary();
```

---

### Tools functions

#### Example

All tools functions take simple parameters.

```javascript
let response = await crownpeak.Tools.recompileLibrary(1234);
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

```

#### Recompile Library

To recompile a Library folder, use the ```recompileLibrary``` function:

```javascript
let response = await crownpeak.Tools.recompileLibrary(folderId);
```

#### Recompile Project

To recompile a Project, use the ```recompileProject``` function:

```javascript
let response = await crownpeak.Tools.recompileProject(projectId);
```

#### Recompile Templates

To recompile the templates in a folder, use the ```recompileTemplates``` function:

```javascript
let response = await crownpeak.Tools.recompileTemplates(folderId);
```

---

### User functions

#### Example

The ```listUsers``` function takes no paraneters, but the ```createUser``` function
requires a Request object to be created.

```javascript
let response = await crownpeak.User.listUsers();
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

For user functions, commonly a ```users``` array will also be returned, for example:

```javascript
{
    "users": [
        {
            "id": 123,
            "username": "test-user@test.com",
            "fname": "Test",
            "lname": "User",
            "fullName": "Test User",
            "email": "test-user@test.com",
            // [...]
        },
        // [...]
    ]
}
```

#### Create

To create a user, use the ```createUser``` function, passing in an instance of the ```User.UserCreateRequest``` class:

```javascript
const request = new crownpeak.User.UserCreateRequest(
    username, 
    emailAddress,
    firstName,
    lastName,
    password // defaults to null, which will auto-generate a new password for the new user
);
let response = await crownpeak.User.createUser(request);
```

#### Get list

To read all users contained within the CMS, use the ```listUsers``` function:

```javascript
let response = await crownpeak.User.listUsers();
```

---

### Workflow functions

#### Example

All workflow functions take simple parameters or none at all.

```javascript
let response = await crownpeak.Workflow.read(workflowId);
```

The response will contain a number of standard properties, plus one or more others that are specific to the type of request that was made. The standard properties are:

```javascript
{
    "resultCode": "conWS_Success", // See crownpeak.Util.ResponseMessages
    "errorMessage": "",
    "internalCode": 0,
    "isSuccessful": true
}
```

You should test the ```isSuccessful``` property before attempting to read other properties.

For workflow functions, commonly a ```workflow``` object will also be returned, for example:

```javascript
{
    "workflow": {
        "id": 12345,
        "name": "My Test Asset",
        // [...]
    }
}
```

#### Get list

To read all workflows contained within the CMS, use the ```getList``` function:

```javascript
let response = await crownpeak.Workflow.getList();
```

#### Read

To read a single workflow, use the ```read``` function:

```javascript
let response = await crownpeak.Workflow.read(workflowId);
```

## Version History
 
| Version       | Date          | Changes                            |
| ------------- | --------------|----------------------------------- |
| 1.0.2         | 2020MAY05     | Initial Release.                   |
| 1.0.3         | 2020JUN08     | Add recompile* functions from Tools controller. |
| 1.0.4         | 2020JUL28     | Add AssetProperties controller.    |
| 1.0.5         | 2020OCT26     | Correct ignoreFilter option for asset.paged(). |
| 1.0.6         | 2021OCT15     | Add Asset.CreateLibraryReference, AssetPropeties.Attachments, AssetProperties.ReadSiteRoot, AssetProperties.SetModel, Asset.DownloadAttachment, Asset.Attachv2, Asset.PathById, Asset.UpdatePluginBody and add filter option for asset.paged(). |
| 1.1.0         | 2023-07-10    | Refactor to use node-fetch, and add User controller. |
| 1.2.0         | 2026-05-18    | Add setSession / clearSession for externally-captured sessions; fix multi-cookie handling in postRequest. |
| 1.3.0         | 2026-09-17    | Add AssetProperties.versions, AssetProperties.allVersions, AssetProperties.versionContent and AssetProperties.revertToVersion. |

## Credit
Thanks to:
* <a href="https://github.com/world93" target="_blank">David Greenberg</a> for the
original version of the helper;
* <a href="https://github.com/richard-lund" target="_blank">Richard Lund</a> for the refactoring;
* <a href="https://github.com/ptylr" target="_blank">Paul Taylor</a> for a few edits ;)
* <a href="https://github.com/marcusedwards-cp" target="_blank">Marcus Edwards</a> for the AssetProperties work and tidying up
* <a href="https://github.com/btcrownpeak" target="_blank">Brad Thompson</a> for refactoring to use node-fetch and sorting out all the failing unit tests

## License
MIT License

Copyright (c) 2023 Crownpeak Technology, inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.