var api = require('../../CrownpeakAPI/API');
const AccessAsset = api.AccessAsset;
var assert = require('assert');
var fs = require('fs');
const {
    promisify
} = require("util");
const openFile = promisify(fs.open);
const readFile = promisify(fs.readFile);
const Util = api.Util;
const promExists = promisify(fs.exists);
const promRealPath = promisify(fs.realpath);
const expect = require('chai').expect;
const should = require('chai').should();
const chaiAssert = require('chai').assert;
const Workflow = api.Workflow;

async function getLoginInfo() {
    var login = await readFile("D:\\Documents\\GitHub\\CP\\loginInfo.json");
    return JSON.parse(login);
}

describe('Authenticate', async function() {
    this.timeout(10000);
    it('Should get an true authentication', function(done) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        getLoginInfo().then(function(loginOptions) {
                var API = new api.Api();
                API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
                    assert.equal(JSON.parse(response.body).resultCode, "conWS_Success", "body returned failure");
                    /*JSON.stringify({
                                    "needsExpirationWarning": false,
                                    "daysToExpire": -1,
                                    "resultCode": "conWS_Success",
                                    "errorMessage": "",
                                    "internalCode": 0
                                })*/
                    ;

                    assert.equal(API.isAuthenticated, true, "Is not authenticated");
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
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        var API = new api.Api();
        getLoginInfo().then((loginOptions) => {
            API.login(loginOptions.username + "1", loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(() => {
                done(Error("Login was successful, thus a failure"))
            }).catch(function(error) {
                done();
            });
        });


    });
});

async function loginAsync() {
    var API = new api.Api();
    var loginOptions = await getLoginInfo();
    await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
    return API;
}

function createAsset(assetName, API, callback) {

    var assetId;
    var accessAsset;
    getLoginInfo().then(function(loginOptions) {
        API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
            accessAsset = new api.AccessAsset.AccessAsset(API);
            var AssetCreateRequest = new api.AccessAsset.AssetCreateRequest(assetName, 144205, 0, api.Util.AssetType.File, 0, 0, 0);
            accessAsset.createAsset(AssetCreateRequest)
                .then(function(response) {
                    assetId = response.asset.id;
                    callback(assetId, accessAsset, response)
                });
        });
    });

}


async function createAssetAsync(assetName, API, createFolder = false, folderId = 144205, workflowId = 11) {
    if (isNaN(folderId)) {
        folderId = 144205;
    }
    var assetId;
    var accessAsset;
    var type = api.Util.AssetType.File;
    var loginOptions = await getLoginInfo();
    await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey)
    accessAsset = new api.AccessAsset.AccessAsset(API);
    if (createFolder) {
        type = api.Util.AssetType.Folder;
    }

    var AssetCreateRequest = new api.AccessAsset.AssetCreateRequest(assetName, folderId, 0, type, 0, 0, workflowId);
    var response = await accessAsset.createAsset(AssetCreateRequest);

    assetId = response.asset.id;
    return {
        assetId: assetId,
        accessAsset: accessAsset
    };
}

describe('AssetTests', function() {
    this.timeout(15000);

    it("Should download an asset", async function() {
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        var API = new api.Api();
        var loginOptions = await getLoginInfo();
        await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var accessAsset = new AccessAsset.AccessAsset(API);
        var uploadAsset = await accessAsset.upload(new api.AccessAsset.AssetUploadRequest(content, 144205, "-1", "DownloadAssetTest", 11))
        var existsResponse = await accessAsset.exists(uploadAsset.asset.id);
        var downloadResponse;
        try{
        if (existsResponse.exists) {
            downloadResponse = await accessAsset.DownloadAssetsPrepareString(new AccessAsset.DownloadAssetsPrepareRequest([uploadAsset.asset.id]));
            var tem = 3;
        } else {
            assert(false, false, "Asset Creation Failed, unable to test");
        }
        chaiAssert((downloadResponse.filename === "DownloadAssetTest"), "FileName Wrong");
        chaiAssert((downloadResponse.fileBuffer === content), "Content Wrong");
        await accessAsset.delete(uploadAsset.asset.id);
    }catch(error){
        await accessAsset.delete(uploadAsset.asset.id);
        assert(false, false, "fail " + error);
    }

        
       
    });

    it("Should download an asset as Buffer", async function() {
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        var API = new api.Api();
        var loginOptions = await getLoginInfo();
        await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var accessAsset = new AccessAsset.AccessAsset(API);
        var uploadAsset = await accessAsset.upload(new api.AccessAsset.AssetUploadRequest(content, 144205, "-1", "DownloadAssetTest", 11))
        var existsResponse = await accessAsset.exists(uploadAsset.asset.id);
        var downloadResponse;
        try{
        if (existsResponse.exists) {
            downloadResponse = await accessAsset.DownloadAssetsPrepareBuffer(new AccessAsset.DownloadAssetsPrepareRequest([uploadAsset.asset.id]));
            var tem = 3;
        } else {
            assert(false, false, "Asset Creation Failed, unable to test");
        }
        chaiAssert((downloadResponse.filename === "DownloadAssetTest"), "FileName Wrong");
        await accessAsset.delete(uploadAsset.asset.id);
    }catch(error){
        await accessAsset.delete(uploadAsset.asset.id);
        assert(false, false, "fail " + error);
    }

        
       
    });

    it('Should create a new asset in the cms', function(done) {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
        var API = new api.Api();
        var accessAsset;
        getLoginInfo().then(function(loginOptions) {
            API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
                accessAsset = new api.AccessAsset.AccessAsset(API);
                var AssetCreateRequest = new api.AccessAsset.AssetCreateRequest("CreateAsset", 144205, 801, api.Util.AssetType.File);

                accessAsset.createAsset(AssetCreateRequest).then(function(response) {
                    var assetId = response.asset.id;
                    accessAsset.exists(assetId).then(function(response) {
                        assert.equal(response.exists, true);
                        accessAsset.delete(assetId).then(
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
            var API = new api.Api();
            API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {
                var accessAsset = new api.AccessAsset.AccessAsset(API);
                var AssetCreateRequest = new api.AccessAsset.AssetCreateRequest("test", 144205, 801, api.Util.AssetType.File);

                var response = accessAsset.createAsset(AssetCreateRequest).then(function(response) {
                    accessAsset.createAsset(AssetCreateRequest).catch(function(err) {
                        var error = JSON.parse(err.message);
                        assert.equal(error.resultCode, api.Util.ResponseMessages.assetAlreadyExists);
                        accessAsset.delete(response.asset.id)
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
        var API = new api.Api();
        var loginOptions = await getLoginInfo();
        await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var accessAsset = new AccessAsset.AccessAsset(API);
        var createResponse = await accessAsset.createAsset(new api.AccessAsset.AssetCreateRequest("CreateBranch", 144205, 0, api.Util.AssetType.File, 0, 0, 11));
        var branchResponse = await accessAsset.branch(createResponse.asset.id);
        var existsResponse = await accessAsset.exists(createResponse.asset.id);
        if (existsResponse.exists) {
            existsResponse = await accessAsset.exists(branchResponse.asset.id);
            if (!await existsResponse.exists) {
                assert(true, false, "Asset branch was not created")
            }
        } else {
            assert(true, false, "Create Asset failed");
        }

        await accessAsset.delete(createResponse.asset.id);
        await accessAsset.delete(branchResponse.asset.id);
    });

    //TODO figure out why exists returns true on deleted assets
    it('Should delete an asset', function(done) {
        var API = new api.Api();
        createAsset("testDelete3", API, function(assetId, accessAsset) {
            accessAsset.delete(assetId).then(function(response) {
                existsCall("/David Test/testDelete3", done, false, accessAsset);
            }).catch(function(error) {
                done(error);
            });
        });

    });

    //TODO check values returned
    it('should add a value to the fields of an asset', function(done) {

        createAsset("ModifyAddFields", new api.Api(), function(assetId, accessAsset) {

            accessAsset.update(new api.AccessAsset.AssetUpdateRequest(assetId, {
                "body": "test"
            })).then(function(response) {

                accessAsset.fields(assetId)
                    .then((response) => {
                        assert.strictEqual(response.resultCode, api.Util.ResponseMessages.success);
                        assert.strictEqual(response.fields[0].value, "test");
                    })
                    .then(function() {
                        done();
                    })
                    .catch((error) => done(error));
                accessAsset.delete(assetId)
                    .catch(function(error) {
                        done(error);
                    });
            }).catch(function(error) {
                done(error);
            });
        });

    });


    it('should remove a value from the fields of an asset', function(done) {

        createAsset("ModifyRemoveFields", new api.Api(), function(assetId, accessAsset) {

            accessAsset.update(new api.AccessAsset.AssetUpdateRequest(assetId, {
                    "body": "test"
                }))
                .then(function(response) {
                    accessAsset.update(new api.AccessAsset.AssetUpdateRequest(assetId, {}, ["body"]))
                        .then(function(response) {
                            accessAsset.fields(assetId)
                                .then((response) => {
                                    assert.strictEqual(response.resultCode, api.Util.ResponseMessages.success);
                                    assert.strictEqual(response.fields.length, 0);
                                    accessAsset.delete(assetId);
                                })
                                .then(function() {
                                    done();
                                })
                                .catch((error) => done(error));
                            accessAsset.delete(assetId);
                        })

                        .catch(function(error) {
                            done(error);
                        });
                });
        });
    });








    it('Should get a list of fields', function(done) {

        createAsset("ListOfFieldsCheck", new api.Api(), function(assetId, accessAsset) {

            accessAsset.update(new api.AccessAsset.AssetUpdateRequest(assetId, {
                    "body": "test"
                }))
                .then(function(response) {
                    accessAsset.fields(assetId).then(function(response) {
                        assert(response);
                        assert.strictEqual(response.fields[0].value, "test");
                        accessAsset.delete(assetId)
                            .then(function() {
                                done();
                            })
                            .catch(function(error) {
                                done(error);
                            });
                    }).catch(function(error) {
                        accessAsset.delete(assetId);
                        done(error);

                    });
                }).catch(function(error) {
                    accessAsset.delete(assetId);
                    done(error);
                });
        });
    });

    it('Should upload an asset to the cms', function(done) {


        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";
        getLoginInfo().then(function(loginOptions) {
            var API = new api.Api();
            API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey)
                .then(function(response) {


                    var accessAsset = new api.AccessAsset.AccessAsset(API);
                    accessAsset.upload(new api.AccessAsset.AssetUploadRequest(content, 144205, "-1", "uploadTest1", 11)).then(function(response) {
                            existsCallV2(response.asset.id, done, true, accessAsset, function() {
                                accessAsset.delete(response.asset.id).then(function() {
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
    //TODO add test for testing replacing an uploaded asset
    it('Should get information about asset', function(done) {
        createAsset("ReadAsset", new api.Api(),
            (assetId, accessAsset) => {
                accessAsset.read(assetId)
                    .then((response) => {
                        assert.strictEqual(response.resultCode, api.Util.ResponseMessages.success);
                        assert.strictEqual(response.asset.id, assetId);
                        accessAsset.delete(assetId).then(() => done())
                    })

                    .catch((error) => done(error));
            })
    });

    it('Should Route an Asset To Live', async function() {
        var routeTo = 785;
        var results = await createAssetAsync("RoutePractice", new api.API());
        var accessAsset = results.accessAsset;
        var createId = results.assetId;
        var response = await accessAsset.route(new api.AccessAsset.AssetRouteRequest(createId, routeTo));

        var readResponse = await accessAsset.read(createId);
        assert(readResponse.asset.status, routeTo, "Asset failed to route");

        await accessAsset.delete(createId);
    });



    it('Should move an asset to a new folder', async function() {
        var API = new api.API();
        var assetResponse = await createAssetAsync("MoveAssetTest", API, false);
        var folderResponse = await createAssetAsync("MoveAssetTestFolder", API, true, 144234);
        var accessAsset = assetResponse.accessAsset;
        try {
            var moveResponse = await accessAsset.move(new AccessAsset.AssetMoveRequest(assetResponse.assetId, folderResponse.assetId));
            var readResponse = await accessAsset.read(assetResponse.assetId);
            assert(readResponse.asset.folder_id, folderResponse.assetId, "Asset was not moved successfully");
            await accessAsset.delete(assetResponse.assetId);
            await accessAsset.delete(folderResponse.assetId);
        } catch (error) {
            await accessAsset.delete(assetResponse.assetId);
            await accessAsset.delete(folderResponse.assetId);
            throw error;
        }

    });

    it("Should publish an asset that doesn't have a workflow", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("PublishTest", API, false, 144234, 0);
        var accessAsset = assetResponse.accessAsset;
        var issue = null;
        try {
            var publishResponse = await accessAsset.publish(new AccessAsset.AssetPublishRequest([assetResponse.assetId]));
            assert(publishResponse.isSuccessful, "Publish was not successful from call");
            chaiAssert.isAbove(publishResponse.publishingSessionId, 0, "The session was not created")
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should refresh a folder", async function() {
        var API = new api.Api();
        var loginOptions = await getLoginInfo();
        await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var accessAsset = new AccessAsset.AccessAsset(API);
        var issue = null;
        try {
            var publishResponse = await accessAsset.publishRefresh(new AccessAsset.AssetPublishRefreshRequest([144234], 785, true));
            assert(publishResponse.isSuccessful, "Publish was not successful from call");
        } catch (error) {
            issue = error;
        }

        if (issue !== null) {
            throw issue;
        }
    });

    it("Should rename an asset", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("RenameTest", API);
        var accessAsset = assetResponse.accessAsset;
        var issue = null;
        try {
            var renameResponse = await accessAsset.rename(new AccessAsset.AssetRenameRequest(assetResponse.assetId, "RenameTestRenamed"));
            var readResponse = await accessAsset.read(assetResponse.assetId);
            assert(readResponse.asset.label, "RenameTestRenamed", "Asset was not renamed to requested value");
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should undelete an asset", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("UnDeleteTest", API);
        var accessAsset = assetResponse.accessAsset;
        var issue = null;
        try {
            await accessAsset.delete(assetResponse.assetId);
            var readResponse1 = await accessAsset.read(assetResponse.assetId);
            assert(readResponse1.asset.is_deleted, true, "Asset was not deleted, rest of test invalid");
            await accessAsset.undelete(assetResponse.assetId);
            var readResponse2 = await accessAsset.read(assetResponse.assetId);
            assert((readResponse2.asset.is_deleted === false), "Asset was not undeleted");
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should attach a file to an asset", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("AttachTest", API);
        var accessAsset = assetResponse.accessAsset;
        var content = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAADCAMAAABh9kWNAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEFBRjFFQTU5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEFBRjFFQTY5QkY4MTFFNDk0NTE4MTJCRDI2RkY1RjAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0QUFGMUVBMzlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0QUFGMUVBNDlCRjgxMUU0OTQ1MTgxMkJEMjZGRjVGMCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pgrzgu4AAAAGUExURf////8AAOta55MAAAAUSURBVHjaYmBgZGBgZAQRDAABBgAAKgAGs/vrsgAAAABJRU5ErkJggg==";

        var issue = null;
        try {
            var attachResponse = await accessAsset.attach(new AccessAsset.AssetAttachRequest(assetResponse.assetId, content, "test.png"));
            assert(attachResponse.isSuccessful, "Wasn't able to attach");
            chaiAssert.isNotNull(attachResponse.displayUrl, "Not successfully attached");
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should move an asset through workflow", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("AttachTest", API);
        var accessAsset = assetResponse.accessAsset;

        var issue = null;
        try {
            var executeResponse = await accessAsset.executeWorkflowCommand(new AccessAsset.ExecuteWorkflowCommandRequest(assetResponse.assetId, 38, true));
            var readResponse = await accessAsset.read(assetResponse.assetId);
            chaiAssert.equal(readResponse.asset.status, 783, "Not in the stage state");
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

    it("Should log a message onto the asset", async function() {
        var API = new api.Api();
        var assetResponse = await createAssetAsync("AttachTest", API);
        var accessAsset = assetResponse.accessAsset;

        var issue = null;
        try {
            var logResponse = await accessAsset.log(assetResponse.assetId, "hello");
            chaiAssert.equal(logResponse.isSuccessful, true, "Was not able to log");
        } catch (error) {
            issue = error;
        }

        await accessAsset.delete(assetResponse.assetId);
        if (issue !== null) {
            throw issue;
        }
    });

});

describe("Workflow", function() {
    this.timeout(10000);
    it("Should get a list of workflows", async function() {
        var API = await loginAsync();
        var workflow = new Workflow(API);
        var workflowResponse = await workflow.getList();
        chaiAssert.equal(workflowResponse.workflows["11"].name, "Basic Workflow", "Did not find Basic Workflow in list");
    });


    it("Should get info about one workflow", async function() {
        var API = await loginAsync();
        var workflow = new Workflow(API);
        var workflowResponse = await workflow.read(11);
        chaiAssert.equal(workflowResponse.workflow.name, "Basic Workflow", "Did not find Basic Workflow in list");
    });
});

describe("AssetsLists", function() {
    this.timeout(20000);

    it('should get a list of assets back', function(done) {
        var API = new api.Api();
        createAsset("Paged1", API, function(assetId, accessAsset) {
            createAsset("Paged2", API, function(assetId1, accessAsset) {
                accessAsset.paged(new api.AccessAsset.AssetPagedRequest(144205, 144205, 0, true, true, api.Util.OrderType.Ascending, 2, false, "", api.Util.VisibilityType.Normal))
                    .then(function(response) {
                        assert.strictEqual(response.assets.length, 2);
                        var promiseList = [accessAsset.delete(assetId1), accessAsset.delete(assetId)];
                        Promise.all(promiseList)
                            .then(() => done())
                            .catch((error) => done(error));

                    });

            });
        });
    });
})

describe("AssetExists", function() {
    this.timeout(15000);

    it('Should return asset exists on path', function(done) {
        createAsset("AssetExistsTest", new api.Api(), function(assetId, accessAsset) {
            existsV2("/David Test2/AssetExistsTest", done, true, function(response) {
                accessAsset.delete(assetId)
                    .then(function() {
                        done();
                    });
            });
        })


    });

    it('Should return asset does not exist on path', function(done) {
        exists("/David Test/bob", done, false);
    });

    it('Should return asset exists on id', function(done) {
        exists("144205", done, true);
    });

    it('Should return asset does not exist on id', function(done) {
        exists("-1", done, false);
    });

    it("Should get information from path of asset with a branch", async function() {
        var API = new api.Api();
        var loginOptions = await getLoginInfo();
        await API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey);
        var accessAsset = new AccessAsset.AccessAsset(API);
        var createResponse = await accessAsset.createAsset(new api.AccessAsset.AssetCreateRequest("CheckMultipleAssetsOnPath", 144205, 0, api.Util.AssetType.File, 0, 0, 11));
        var branchResponse = await accessAsset.branch(createResponse.asset.id);
        var existsResponseId = await accessAsset.exists(createResponse.asset.id);
        var existsResponsePath = await accessAsset.exists("/David Test/CheckMultipleAssetsOnPath");
        assert(existsResponseId.assetId, existsResponsePath.assetId, "Path returns different asset than first created");

        await accessAsset.delete(createResponse.asset.id);
        await accessAsset.delete(branchResponse.asset.id);

    });


    it('Should correctly return multiple exists test', function(done) {
        var promiseList = [];
        for (var i = 0; i < 30; i++) {
            promiseList.push(existsasync("-1", done, false));
        }
        Promise.all(promiseList)
            .then(() => {
                done();
            }).catch((error) => {
                done(error);
            });
    });



});





function existsCallV2(id, done, shouldExist, accessAsset, callback) {
    return accessAsset.exists(id).then(function(response) {
        assert.strictEqual(response.exists, shouldExist);
        if (callback !== undefined) {
            callback(response);
        }
    }).catch(function(error) {
        done(error);
    });
}

function existsCall(id, done, shouldExist, accessAsset, callback) {
    return accessAsset.exists(id).then(function(response) {
        assert.equal(response.exists, shouldExist);
        if (callback !== undefined) {
            callback(response, accessAsset);
        }
    }).then(done).catch(function(error) {
        done(error);
    });
}

async function existsasync(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var API = new api.Api();
        API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            var accessAsset = new AccessAsset.AccessAsset(API);
            existsCall(id, done, shouldExist, accessAsset, callback);

        });
    });
}


function exists(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var API = new api.Api();
        API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            var accessAsset = new AccessAsset.AccessAsset(API);
            existsCall(id, done, shouldExist, accessAsset, callback);

        });
    });
}

function existsV2(id, done, shouldExist, callback) {
    getLoginInfo().then(function(loginOptions) {
        var API = new api.Api();
        API.login(loginOptions.username, loginOptions.password, loginOptions.host, loginOptions.instance, loginOptions.apikey).then(function(response) {

            var accessAsset = new AccessAsset.AccessAsset(API);
            existsCallV2(id, done, shouldExist, accessAsset, callback);

        });
    });
}



/**
 * Compare the local files and folders to those on the cms, retire those that have workflow and delete those that do not
 * @param {string} localFolder - the local folder on the computer to compare to the live site 
 * @param {string} cmsFolder - The cms folder to compare to the local folder
 * @param {boolean} deleteCreated - If true, deletes all assets checked
 */
async function compareLocalFilesToCMS(localFolder, cmsFolder, accessAsset, deleteCreated) {
    var pages = [];
    var currentPage = 0;
    var currentFolder;
    var currentFile;
    var asset = await accessAsset.exists(cmsFolder);
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

            pages = await accessAsset.paged(new AccessAsset.AssetPagedRequest(currentFolder, "", currentPage, true, true, "", 1000, false, "", Util.VisibilityType.Normal));
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
        await accessAsset.delete(temp);
    }
}