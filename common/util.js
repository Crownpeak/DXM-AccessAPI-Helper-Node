const AssetType = {
    None: 0,
    File: 2,
    Folder: 4,
    Mount: 9,
    Connector: 10
}

const AssetSubType = {
    None: 0,
    DeveloperTemplate: 1,
    TemplateFile: 17,
    Project: 32,
    Library: 64,
    SiteRoot: 128,
    TemplateFolder: 256,
    Template: 512,
    Workflow: 1024,
    State: 2048,
    ModelFolder: 4096,
    ComponentFramework: 8192
}

const OrderType = {
    Ascending: 0,
    Descending: 1,
    NotSet: 2,
    Saved: 3
}

const VisibilityType = {
    Deleted: 2,
    Hidden: 1,
    Normal: 0
}

const TemplateLanguageType = {
    CSharp: 1
}

const StatusCode = {
    Timeout: 429
}

const ResponseMessages = {
    Success: "conWS_Success",
    InvalidUser: "conWS_InvalidUserNameOrPassword",
    AssetAlreadyExists: "conWS_ConflictAlreadyExists"
}

/**
 * List of first few bytes of a filetype
 */
const FileType = {
    jpeg: [0xFF, 0xD8], //Skip 0x22
    tiff: [0x49, 0x49, 0x2A],
    bitmap: [0x42, 0x4D],
    gif: [0x47, 0x49, 0x46]
}

const FileList = {
    JPEG: 1,
    TIFF: 2,
    BITMAP: 3,
    GIF: 4,
    OTHER: 5
}

const Chars = {
    NUL: String.fromCharCode(0), // Null char
    BS: String.fromCharCode(8), // Back Space
    CR: String.fromCharCode(13), // Carriage Return
    SUB: String.fromCharCode(26) // Substitute
}

function IsValidJSONString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

class Debug {
    /**
     * Turn Debug on and off
     * @param {boolean} debug - true if debug should occur, false otherwise 
     */
    constructor(debug, debugFunction) {
        this._debug = debug;
        if (debugFunction !== null && debugFunction !== undefined) {
            this._log = debugFunction;
        } else {
            this._log = console.log;
        }

    }

    set debug(debug) {
        this._debug = debug;
    }

    get debug() {
        return this._debug;
    }
    /**
     * Output text to console. Created to allow turning off or changing of debug commands
     * @param {*} text 
     */
    log(text) {
        if (this._debug) {
            this._log(text);
        }
    }

}

/**
 * Function for making call to the cms and return the data async
 * @param {api.api} api - The api to make all calls
 * @param {string} urlPath - The uri path of the request
 * @param {JSON} data - The data being sent in json format
 * @param {function(JSON)=} callback - A function to be run on success if desired
 * @param {function(JSON)=} onError - A function to run on error
 */
const makeCall = async (api, urlPath, data, callback, onError) => {
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
    
    var response = makeCallResponse.parentResponse;
    response.isSuccessful = (response.resultCode === ResponseMessages.Success);
    return response;
};

/**
 * Function for making call to the cms and return the data async
 * @param {api.api} api - The api to make all calls
 * @param {string} urlPath - The uri path of the request
 * @param {function(any)=} callback - A function to be run on success if desired
 * @param {function(any)=} onError - A function to run on error
 */
const makeCmsCall = async (api, urlPath, callback, onError) => {
    let errorMessage = "";
    let responseText = "";
    await api.getCmsRequest(urlPath, function(response) {
            responseText = response;
            if (callback !== undefined) {
                callback(response);
            }
        },
        function(error) {
            errorMessage = error;

            if (onError !== undefined) {
                onError(error);
            }
        });

    if (errorMessage !== "") { //The code errored out
        throw Error(errorMessage.error);
    }
    return responseText.body;
};

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
 * Create a timeout promise
 * @param {number} ms - The number of milliseconds to wait 
 */
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    AssetType: AssetType,
    AssetSubType: AssetSubType,
    TemplateLanguageType: TemplateLanguageType,
    ResponseMessages: ResponseMessages,
    IsValidJSONString: IsValidJSONString,
    StatusCode: StatusCode,
    InitialTimeoutWait: 3000,
    OrderType: OrderType,
    VisibilityType: VisibilityType,
    ResultCode: ResponseMessages,
    FileType: FileType,
    FileList: FileList,
    Chars: Chars,
    Debug: Debug,
    timeout: timeout,
    makeCall: makeCall,
    makeCmsCall
}