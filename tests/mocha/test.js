const dotenv = require("dotenv");
var crownpeakapi = require('../../api');
var assert = require('assert');
var fs = require('fs');
const {
    promisify
} = require("util");
const openFile = promisify(fs.open);
const readFile = promisify(fs.readFile);
const Util = crownpeakapi.Util;
const promExists = promisify(fs.exists);
const promRealPath = promisify(fs.realpath);
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAssert = require('chai').assert;
// const postTemplate = 145401;
let testFolder = 0;
async function getLoginInfo() {
    const cwd = process.env.INIT_CWD;
    let config = process.env;

    if (fs.existsSync(cwd + "/.env")) {
        Object.assign(config, dotenv.parse(fs.readFileSync(cwd + "/.env")))
    }

    let result = {
        "username": config.CMS_USERNAME,
        "password": config.CMS_PASSWORD,
        "apikey": config.CMS_API_KEY,
        "host": config.CMS_HOST,
        "instance": config.CMS_INSTANCE,
        "cmsFolder": config.CMS_FOLDER_PATH,
        "model": config.CMS_MODEL_ASSET_ID,
        "workflow": config.CMS_WORKFLOW || 11,
        "workflowCommand": config.CMS_WORKFLOW_COMMAND || 38
    };
    if (result.cmsFolder.slice(-1) !== '/') 
        result.cmsFolder = result.cmsFolder + "/";
    return result;
}

describe('Authenticate', async function() {
    this.timeout(10000);
    it('Should get an true authentication', function(done) {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        getLoginInfo().then(function(loginOptions) {
            var api = new crownpeakapi();
            api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
                assert.equal(JSON.parse(response.body).resultCode, "conWS_Success", "body returned failure");
                /*JSON.stringify({
                                "needsExpirationWarning": false,
                                "daysToExpire": -1,
                                "resultCode": "conWS_Success",
                                "errorMessage": "",
                                "internalCode": 0
                            })*/
                ;

                assert.equal(api.isAuthenticated, true, "Is not authenticated");
                //assert.equal(API.cookie !== undefined)

            }).then(done).catch(function(error) {
                done(error);
            });
        })
        .catch(
            (error) => done(error)
        );
    });

    it('Should fail to login', function(done) {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        var api = new crownpeakapi();
        getLoginInfo().then((loginOptions) => {
            api.login(loginOptions.username + "1", loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(() => {
                done(Error("Login was successful, thus a failure"))
            }).catch(function(error) {
                done();
            });
        });
    });
});

async function loginAsync() {
    const api = new crownpeakapi();
    var loginOptions = await getLoginInfo();
    await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
    return api;
}

function createAsset(assetName, api, callback) {

    ensureTestFolder().then(() => {
        getLoginInfo().then(function(loginOptions) {
            api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
                var assetCreateRequest = new api.Asset.CreateRequest(assetName, testFolder, 0, api.Util.AssetType.File, 0, 0, 0);
                api.Asset.create(assetCreateRequest)
                    .then(function(response) {
                        callback(response.asset.id, response)
                    });
            });
        });
    });

}


async function createAssetAsync(assetName, api, createFolder = false, folderId, workflowId, templateId = 0,modelId = 0) {
    if (isNaN(folderId)) {
        await ensureTestFolder();
        folderId = testFolder;
    }
    var assetId;
    var devTemplateLanguage = 0;
    var type = api.Util.AssetType.File;
    var loginOptions = await getLoginInfo();
    await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey)
    if (createFolder) {
        type = api.Util.AssetType.Folder;
    }

    if(templateId!=0){
        devTemplateLanguage = -1;
    }

    if (!workflowId && workflowId !== 0 && !createFolder) workflowId = loginOptions.workflow;
    var AssetCreateRequest = new api.Asset.CreateRequest(assetName, folderId, modelId, type, devTemplateLanguage, templateId, workflowId);
    var response = await api.Asset.create(AssetCreateRequest);

    assetId = response.asset.id;
    return assetId;
}

async function ensureTestFolder() {
    if (!testFolder) {
        var api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var result = await api.Asset.exists(loginOptions.cmsFolder);
        if (result && result.exists && result.assetId) testFolder = result.assetId;
    }
}

describe('AssetTests', function() {
    this.timeout(15000);

    it("Should create a folder with models", async function() {
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        await ensureTestFolder();
        var createFolderResponse = await api.Asset.createFolderWithModel(new api.Asset.CreateFolderWithModelRequest("temp",testFolder,800));
        try{
            var existsResponse = await api.Asset.exists(createFolderResponse.asset.id);
            assert(existsResponse.exists, "Folder was not created successfully")
            var readResponse = await api.Asset.read(createFolderResponse.asset.id);
            assert(readResponse.asset.model_id == 800, "Asset was not created with model");
        }catch(ex){

        }
        await api.Asset.delete(createFolderResponse.asset.id);
    });

    it("Should download an asset", async function() {
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        await ensureTestFolder();
        var uploadAsset = await api.Asset.upload(new api.Asset.UploadRequest(content, testFolder, "-1", "DownloadAssetTest", loginOptions.workflow))
        var existsResponse = await api.Asset.exists(uploadAsset.asset.id);
        try{
            var downloadResponse;
            if (existsResponse.exists) {
                downloadResponse = await api.Asset.downloadAsString(new api.Asset.DownloadPrepareRequest([uploadAsset.asset.id]));
            } else {
                assert(false, false, "Asset creation failed, unable to test");
            }
            chaiAssert((downloadResponse.filename === "DownloadAssetTest"), "FileName Wrong");
            chaiAssert((downloadResponse.fileBuffer === content), "Content Wrong");
            await api.Asset.delete(uploadAsset.asset.id);
        }catch(error){
            await api.Asset.delete(uploadAsset.asset.id);
            assert(false, false, "fail " + error);
        }
    });

    it("Should download an asset as Buffer", async function() {
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        await ensureTestFolder();
        var uploadAsset = await api.Asset.upload(new api.Asset.UploadRequest(content, testFolder, "-1", "DownloadAssetTest", loginOptions.workflow))
        var existsResponse = await api.Asset.exists(uploadAsset.asset.id);
        try{
            var downloadResponse;
            if (existsResponse.exists) {
                downloadResponse = await api.Asset.downloadAsBuffer(new api.Asset.DownloadPrepareRequest([uploadAsset.asset.id]));
            } else {
                assert(false, false, "Asset creation failed, unable to test");
            }
            chaiAssert((downloadResponse.filename === "DownloadAssetTest"), "FileName Wrong");
            await api.Asset.delete(uploadAsset.asset.id);
        }catch(error){
            await api.Asset.delete(uploadAsset.asset.id);
            assert(false, false, "fail " + error);
        }
    });

    it('Should create a new asset in the cms', function(done) {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        const api = new crownpeakapi();
        getLoginInfo().then(async function(loginOptions) {
            api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(async function(response) {
                await ensureTestFolder();
                var assetCreateRequest = new api.Asset.CreateRequest("CreateAsset", testFolder, 801, api.Util.AssetType.File);

                api.Asset.create(assetCreateRequest).then(function(response) {
                    var assetId = response.asset.id;
                    api.Asset.exists(assetId).then(function(response) {
                        assert.equal(response.exists, true);
                        api.Asset.delete(assetId).then(
                            function() {
                                done();
                            }
                        ).catch(function(error) {
                            done(error);
                        });
                    }).catch(function(error) {
                        done(error);
                    });

                }).catch(function(err) {
                    done(err);
                });
            });
        });
    });

    it('Should fail to create asset', function(done) {
        //Check asset already exists, then check creating an asset fails
        getLoginInfo().then(function(loginOptions) {
            const api = new crownpeakapi();
            api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(async function(response) {
                await ensureTestFolder();
                var assetCreateRequest = new api.Asset.CreateRequest("test", testFolder, 801, api.Util.AssetType.File);

                api.Asset.create(assetCreateRequest).then(function(response) {
                    api.Asset.create(assetCreateRequest).catch(function(err) {
                        var error = JSON.parse(err.message);
                        assert.equal(error.resultCode, api.Util.ResponseMessages.AssetAlreadyExists);
                        api.Asset.delete(response.asset.id)
                            .then(function() {
                                done();
                            });

                    })
                }).catch(function(err) {
                    done(err);
                })
            });
        });
    });

    it("Should branch an asset", async function() {
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        await ensureTestFolder();
        var createResponse = await api.Asset.create(new api.Asset.CreateRequest("CreateBranch", testFolder, 0, api.Util.AssetType.File, 0, 0, loginOptions.workflow));
        var branchResponse = await api.Asset.branch(createResponse.asset.id);
        var existsResponse = await api.Asset.exists(createResponse.asset.id);
        if (existsResponse.exists) {
            existsResponse = await api.Asset.exists(branchResponse.asset.id);
            if (!await existsResponse.exists) {
                assert(true, false, "Asset branch was not created")
            }
        } else {
            assert(true, false, "Create Asset failed");
        }

        await api.Asset.delete(createResponse.asset.id);
        await api.Asset.delete(branchResponse.asset.id);
    });

    //TODO figure out why exists returns true on deleted assets
    it('Should delete an asset', function(done) {
        const api = new crownpeakapi();
        getLoginInfo().then((loginOptions) => {
            createAsset("testDelete3", api, function(assetId) {
                api.Asset.delete(assetId).then(function(_response) {
                    existsCall(loginOptions.cmsFolder + "testDelete3", done, false, api);
                }).catch(function(error) {
                    done(error);
                });
            });
        });
    });

    //TODO check values returned
    it('should add a value to the fields of an asset', function(done) {
        const api = new crownpeakapi();
        createAsset("ModifyAddFields", api, function(assetId) {

            api.Asset.update(new api.Asset.UpdateRequest(assetId, {
                "body": "test"
            })).then(function(_response) {

                api.Asset.fields(assetId)
                    .then(response => {
                        assert.strictEqual(response.resultCode, api.Util.ResponseMessages.Success);
                        assert.strictEqual(response.fields[0].value, "test");
                    })
                    .then(function() {
                        done();
                    })
                    .catch((error) => done(error));
                api.Asset.delete(assetId)
                    .catch(function(error) {
                        done(error);
                    });
            }).catch(function(error) {
                done(error);
            });
        });
    });

    // TODO: make this create what it needs to do its job
    //Post Input and Post Save
    // it('should update perform postsave and post input',async function(){
    //     await ensureTestFolder();
    //     const api = new crownpeakapi();

    //     var createId = await createAssetAsync("PostTestAsset", API,false,testFolder, 11, postTemplate);

    //     var issue = null;
    //     var postSave = false;
    //     var postInput = false;
    //     try{
    //         var updateRequest = new api.Asset.UpdateRequest(createId, {
    //             "body": "test"
    //         },{},true,true);
    //         var updateResponse = await api.Asset.update(updateRequest);

    //         var fields = await api.Asset.fields(createId);
    //         fields = fields.fields;
    //         for(var i=0;i<fields.length;i++){
    //             if(fields[i].name ==="postinput"){
    //                 postInput = fields[i].value

    //             }

    //             if(fields[i].name === "postsave"){
    //                 postSave = fields[i].value

    //             }
    //         };

    //         assert(postInput == "saved", "Post Input did not run successfully");
    //         assert(postSave == "saved", "PostSave did not run successfully");

    //     }catch(ex){
    //         issue = ex;
    //     }


    //     await api.Asset.delete(createId);
    //     if (issue !== null) {
    //         throw issue;
    //     }
    // });

    it('should remove a value from the fields of an asset', function(done) {
        const api = new crownpeakapi();
        createAsset("ModifyRemoveFields", api, function(assetId) {

            api.Asset.update(new api.Asset.UpdateRequest(assetId, {
                    "body": "test"
                }))
                .then(function(_response) {
                    api.Asset.update(new api.Asset.UpdateRequest(assetId, {}, ["body"]))
                        .then(function(_response) {
                            api.Asset.fields(assetId)
                                .then(response => {
                                    assert.strictEqual(response.resultCode, api.Util.ResponseMessages.Success);
                                    assert.strictEqual(response.fields.length, 0);
                                    api.Asset.delete(assetId);
                                })
                                .then(function() {
                                    done();
                                })
                                .catch((error) => done(error));
                        })
                        .catch(function(error) {
                            done(error);
                        });
                });
        });
    });

    it('Should get a list of fields', function(done) {
        const api = new crownpeakapi();
        createAsset("ListOfFieldsCheck", api, function(assetId) {

            api.Asset.update(new api.Asset.UpdateRequest(assetId, {
                    "body": "test"
                }))
                .then(function(_response) {
                    api.Asset.fields(assetId).then(function(response) {
                        assert(response);
                        assert.strictEqual(response.fields[0].value, "test");
                        api.Asset.delete(assetId)
                            .then(function() {
                                done();
                            })
                            .catch(function(error) {
                                done(error);
                            });
                    }).catch(function(error) {
                        api.Asset.delete(assetId);
                        done(error);

                    });
                }).catch(function(error) {
                    api.Asset.delete(assetId);
                    done(error);
                });
        });
    });

    it('Should upload an asset to the cms', function(done) {
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        getLoginInfo().then(function(loginOptions) {
            const api = new crownpeakapi();
            api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey)
                .then(async function(_response) {
                    await ensureTestFolder();
                    api.Asset.upload(new api.Asset.UploadRequest(content, testFolder, "-1", "uploadTest1", loginOptions.workflow)).then(function(response) {
                            existsCallV2(response.asset.id, done, true, api, function() {
                                api.Asset.delete(response.asset.id).then(function() {
                                    done();
                                }).catch(function(error) {
                                    done(error);
                                });
                            });
                        })
                        .catch(function(error) {
                            done(error);
                        });
                });
        });
    });

    //TODO add tests for testing replacing an uploaded asset

    it('Should get information about asset', function(done) {
        const api = new crownpeakapi();
        createAsset("ReadAsset", api, assetId => {
            api.Asset.read(assetId)
                .then(response => {
                    assert.strictEqual(response.resultCode, api.Util.ResponseMessages.Success);
                    assert.strictEqual(response.asset.id, assetId);
                    api.Asset.delete(assetId).then(() => done())
                })
                .catch(error => {
                    api.Asset.delete(assetId).then(() => done(error));
                });
        });
    });

    it('Should route an asset To Live', async function() {
        await ensureTestFolder();
        var DRAFT = 780;
        var LIVE = 785;
        var loginOptions = await getLoginInfo();
        const api = new crownpeakapi();
        var createId = await createAssetAsync("RoutePractice", api, false, testFolder, loginOptions.workflow);
        await api.Asset.route(new api.Asset.RouteRequest(createId, LIVE));

        var readResponse = await api.Asset.read(createId);
        assert(readResponse.asset.status, LIVE, "Asset failed to route");

        await api.Asset.route(new api.Asset.RouteRequest(createId, DRAFT));
        await api.Asset.delete(createId);
    });

    it('Should move an asset to a new folder', async function() {
        await ensureTestFolder();
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("MoveAssetTest", api, false);
        var folderId = await createAssetAsync("MoveAssetFolderTest", api, true, testFolder);
        try {
            await api.Asset.move(new api.Asset.MoveRequest(assetId, folderId));
            var readResponse = await api.Asset.read(assetId);
            assert(readResponse.asset.folder_id, folderId, "Asset was not moved successfully");
            await api.Asset.delete(assetId);
            await api.Asset.delete(folderId);
        } catch (error) {
            await api.Asset.delete(assetId);
            await api.Asset.delete(folderId);
            throw error;
        }
    });

    it("Should publish an asset that doesn't have a workflow", async function() {
        await ensureTestFolder();
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("PublishTest", api, false, testFolder, 0);
        var issue = null;
        try {
            var publishResponse = await api.Asset.publish(new api.Asset.PublishRequest([assetId]));
            assert(publishResponse.isSuccessful, "Publish was not successful from call");
            chaiAssert.isAbove(publishResponse.publishingSessionId, 0, "The session was not created")
        } catch (error) {
            issue = error;
        }

        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should refresh a folder", async function() {
        await ensureTestFolder();
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var issue = null;
        try {
            var publishResponse = await api.Asset.publishRefresh(new api.Asset.PublishRefreshRequest([testFolder], 785, true));
            assert(publishResponse.isSuccessful, "Publish was not successful from call");
        } catch (error) {
            issue = error;
        }

        if (issue !== null) {
            throw issue;
        }
    });

    it("Should rename an asset", async function() {
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("RenameTest", api);
        var issue = null;
        try {
            await api.Asset.rename(new api.Asset.RenameRequest(assetId, "RenameTestRenamed"));
            var readResponse = await api.Asset.read(assetId);
            assert(readResponse.asset.label, "RenameTestRenamed", "Asset was not renamed to requested value");
        } catch (error) {
            issue = error;
        }

        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should undelete an asset", async function() {
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("UnDeleteTest", api);
        var issue = null;
        try {
            await api.Asset.delete(assetId);
            var readResponse1 = await api.Asset.read(assetId);
            assert(readResponse1.asset.is_deleted, true, "Asset was not deleted, rest of tests invalid");
            await api.Asset.undelete(assetId);
            var readResponse2 = await api.Asset.read(assetId);
            assert((readResponse2.asset.is_deleted === false), "Asset was not undeleted");
        } catch (error) {
            issue = error;
        }

        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should attach a file to an asset", async function() {
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("AttachTest", api);
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";

        var issue = null;
        try {
            var attachResponse = await api.Asset.attach(new api.Asset.AttachRequest(assetId, content, "tests.png"));
            assert(attachResponse.isSuccessful, "Wasn't able to attach");
            chaiAssert.isNotNull(attachResponse.displayUrl, "Not successfully attached");
        } catch (error) {
            issue = error;
        }

        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should move an asset through workflow", async function() {
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("WorkflowCommandTest", api);

        var loginOptions = await getLoginInfo();
        var issue = null;
        try {
            var DRAFT = 780;
            var STAGE = 783;
            await api.Asset.executeWorkflowCommand(new api.Asset.ExecuteWorkflowCommandRequest(assetId, loginOptions.workflowCommand, true));
            var readResponse = await api.Asset.read(assetId);
            chaiAssert.equal(readResponse.asset.status, STAGE, "Not in the stage state");
        } catch (error) {
            issue = error;
        }

        await api.Asset.route(new api.Asset.RouteRequest(assetId, DRAFT));
        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should log a message onto the asset", async function() {
        const api = new crownpeakapi();
        var assetId = await createAssetAsync("LogTest", api);

        var issue = null;
        try {
            var logResponse = await api.Asset.log(assetId, "hello");
            chaiAssert.equal(logResponse.isSuccessful, true, "Was not able to log");
        } catch (error) {
            issue = error;
        }

        await api.Asset.delete(assetId);
        if (issue !== null) {
            throw issue;
        }
    });

});

describe("Report", function() {
    this.timeout(10000);
    it("Should get a site summary report", async function() {
        const api = await loginAsync();
        var reportResponse = await api.Report.siteSummary();
        chaiAssert.equal(reportResponse.isSuccessful, true, "Was not able to run site summary report");
        chaiAssert.isDefined(reportResponse.reportData, "Was not able to read site summary data");
        chaiAssert.notEqual(reportResponse.reportData.totalSites, 0, "Was not able to read site summary data");
    });
});

describe("Workflow", function() {
    this.timeout(10000);
    it("Should get a list of workflows", async function() {
        var loginOptions = await getLoginInfo();
        const api = await loginAsync();
        var workflowResponse = await api.Workflow.getList();
        chaiAssert.equal(workflowResponse.workflows[loginOptions.workflow].name, "Basic Workflow", "Did not find Basic Workflow in list");
    });

    it("Should get info about one workflow", async function() {
        var loginOptions = await getLoginInfo();
        const api = await loginAsync();
        var workflowResponse = await api.Workflow.read(loginOptions.workflow);
        chaiAssert.equal(workflowResponse.workflow.name, "Basic Workflow", "Did not find Basic Workflow in list");
    });
});

describe("AssetsLists", function() {
    this.timeout(20000);

    it('should get a list of assets back', function(done) {
        ensureTestFolder().then(() => {
            const api = new crownpeakapi();
            createAsset("Paged1", api, function(assetId) {
                createAsset("Paged2", api, function(assetId1) {
                    api.Asset.paged(new api.Asset.PagedRequest(testFolder, 0, 0, true, true, api.Util.OrderType.Ascending, 2, false, "", api.Util.VisibilityType.Normal))
                        .then(function(response) {
                            assert.strictEqual(response.assets.length, 2);
                            var promiseList = [api.Asset.delete(assetId1), api.Asset.delete(assetId)];
                            Promise.all(promiseList)
                                .then(() => done())
                                .catch((error) => done(error));

                        });
                });
            });
        });
    });
})

describe("AssetExists", function() {
    this.timeout(15000);

    it('Should return asset exists on path', function(done) {
        getLoginInfo().then((loginOptions) => {
            const api = new crownpeakapi();
            createAsset("AssetExistsTest", api, function(assetId) {
            existsV2(loginOptions.cmsFolder + "AssetExistsTest", done, true, function(_response) {
                api.Asset.delete(assetId)
                    .then(function() {
                        done();
                    });
                });
            });
        });
    });

    it('Should return asset does not exist on path', function(done) {
        getLoginInfo().then((loginOptions) => {
            exists(loginOptions.cmsFolder + "bob", done, false);
        });
    });

    it('Should return asset exists on id', async function() {
        await ensureTestFolder();
        await exists(testFolder, null, true);
    });

    it('Should return asset does not exist on id', function(done) {
        exists("-1", done, false);
    });

    it("Should get information from path of asset with a branch", async function() {
        const api = new crownpeakapi();
        var loginOptions = await getLoginInfo();
        await api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        await ensureTestFolder();
        var createResponse = await api.Asset.create(new api.Asset.CreateRequest("CheckMultipleAssetsOnPath", testFolder, 0, api.Util.AssetType.File, 0, 0, loginOptions.workflow));
        var branchResponse = await api.Asset.branch(createResponse.asset.id);
        var existsResponseId = await api.Asset.exists(createResponse.asset.id);
        var existsResponsePath = await api.Asset.exists(loginOptions.cmsFolder + "CheckMultipleAssetsOnPath");
        assert(existsResponseId.assetId, existsResponsePath.assetId, "Path returns different asset than first created");

        await api.Asset.delete(createResponse.asset.id);
        await api.Asset.delete(branchResponse.asset.id);
    });


    it('Should correctly return multiple exists tests', function(done) {
        var promiseList = [];
        for (var i = 0; i < 30; i++) {
            promiseList.push(existsasync("-1", null, false));
        }
        Promise.all(promiseList)
            .then(() => {
                done();
            }).catch((error) => {
                done(error);
            });
    });

});


function existsCallV2(id, done, shouldExist, api, callback) {
    return api.Asset.exists(id).then(function(response) {
        assert.strictEqual(response.exists, shouldExist);
        if (callback !== undefined) {
            callback(response, api);
        }
    }).catch(function(error) {
        done(error);
    });
}

function existsCall(id, done, shouldExist, api, callback) {
    return api.Asset.exists(id).then(function(response) {
        assert.equal(response.exists, shouldExist);
        if (callback !== undefined) {
            callback(response, api);
        }
    }).then(done).catch(function(error) {
        done(error);
    });
}

async function existsasync(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var api = new crownpeakapi();
        api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            existsCall(id, done, shouldExist, api, callback);

        });
    });
}


function exists(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var api = new crownpeakapi();
        api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            existsCall(id, done, shouldExist, api, callback);

        });
    });
}

function existsV2(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var api = new crownpeakapi();
        api.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            existsCallV2(id, done, shouldExist, api, callback);

        });
    });
}



/**
 * Compare the local files and folders to those on the cms, retire those that have workflow and delete those that do not
 * @param {string} localFolder - the local folder on the computer to compare to the live site 
 * @param {string} cmsFolder - The cms folder to compare to the local folder
 * @param {boolean} deleteCreated - If true, deletes all assets checked
 */
async function compareLocalFilesToCMS(localFolder, cmsFolder, api, deleteCreated) {
    var pages = [];
    var currentPage = 0;
    var currentFolder;
    var currentFile;
    var asset = await api.Asset.exists(cmsFolder);
    if (!asset.exists) {
        throw Error("Folder does not exist");
    }
    var listToDelete = [];
    var cmsFolders = [asset.assetId];
    while (cmsFolders.length > 0) {
        currentPage = 0;
        //Get the folder to search through on the cms
        currentFolder = cmsFolders.pop();
        do {

            pages = await api.Asset.paged(new api.Asset.PagedRequest(currentFolder, "", currentPage, true, true, "", 1000, false, "", Util.VisibilityType.Normal));
            //Does it make more sense to make this asynchronous synchronous (i.e. wait for it to complete or to make each a promise)
            for (var page of pages.assets) {

                currentFile = page.fullPath.replace(cmsFolder, localFolder + "\\").replace(/\//g, "\\");
                console.log("Checking " + currentFile);
                if (currentFolder == asset.assetId) {
                    listToDelete.push(page.id);
                }
                //Check if file exists locally.
                if (!(await promExists(currentFile))) {
                    //File doesn't exist, so delete it on the cms
                    assert(false, true, "Asset " + currentFile + " / " + page.fullPath + " doesn't exist on the server");
                    continue;
                }

                //File/folder exists. If it's a folder add to the list
                if (page.type === Util.AssetType.Folder) {
                    //Asset is folder, check if it exists locally
                    cmsFolders.push(page.id);
                }
            }
            currentPage++;
        } while (pages.assets.length > 0);
    }
    for (var temp of listToDelete) {
        await api.Asset.delete(temp);
    }
}