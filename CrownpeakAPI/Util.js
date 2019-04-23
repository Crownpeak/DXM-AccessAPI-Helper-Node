const AssetType = {
    None: 0,
    File: 2,
    Folder: 4,
    Mount: 9,
    Connector: 10
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

const StatusCode = {
    timeout: 429
}

const ResponseMessages = {
    success: "conWS_Success",
    invalidUser: "conWS_InvalidUserNameOrPassword",
    assetAlreadyExists: "conWS_ConflictAlreadyExists"
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
 * Create a timeout promise
 * @param {number} ms - The number of milliseconds to wait 
 */
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    AssetType: AssetType,
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
    timeout: timeout
}