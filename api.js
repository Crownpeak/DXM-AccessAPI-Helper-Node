const Asset = require("./common/asset");
const Util = require("./common/util");
const Workflow = require("./common/workflow");

const apiErrors = {
    InstanceNameInvalid: 1
}

/********************************************
 * Javascript API for utilizing the crownpeak API
 * All function are asyncronous and are operated upon by
 * promises
 *
 ********************************************/
class api {

    constructor() {
        this.host;
        this.instance;
        this.apiKey;
        this._isAuthenticated = false;
        this._error;
        this.cookie;
        this.https = require("https");
        this.requestLib = require('request-promise');
        this.webAPIRoot = "/cpt_webservice/accessapi/";
        this.Asset = new Asset(this);
        this.Workflow = new Workflow(this);
    }


    get isAuthenticated() {
        return this._isAuthenticated;
    }

    get error() {
        return this._error;
    }


    /**
     * Authenticate the user such that all other function can run
     * @param {string} username - The username of the user
     * @param {string} password - The password of the user
     * @param {string} host - The host of the user
     * @param {string} instance
     * @param {string} apiKey
     */
    async login(username, password, host, instance, apiKey) {
        this.host = host;
        this.instance = instance;
        this.apiKey = apiKey;
        var apiParent = this;
        var parentResponse; //Store the response for return of the await
        var parentError; //Store the error
        var authJson = {
            "instance": instance,
            "username": username,
            "password": password,
            "remember_me": "false",
            "timeZoneOffsetMinutes": "-480"
        };


        await this.postRequest("/Auth/Authenticate", authJson,
            function(response) {
                parentResponse = response;
            },
            function(error) {
                parentError = error;
            });


        if (parentResponse !== undefined && Util.IsValidJSONString(parentResponse.body)) {
            var jsonBody = JSON.parse(parentResponse.body);
            if (jsonBody.resultCode === Util.ResponseMessages.Success) {
                //User was successfully authenticated
                this._isAuthenticated = true;
                this.cookie = parentResponse.headers["set-cookie"];
            } else {
                this._error = parentResponse;
            }
        } else {
            if (parentError !== undefined && Util.IsValidJSONString(parentError.error)) {
                this._error = parentError;
                throw parentError;
            }
            throw Error("Unable to contact CMS, please check your settings");
        }

        return parentResponse;
    }


    static currentDate() {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        return mm + '/' + dd + '/' + yyyy;

    }

    /**
     *
     * @param {string} urlPath - The path to call from the url
     * @param {JSON|string} data - The data to send in the request
     * @param {function(object)} callback - function to run on succes
     * @param {function(object)} onError - function to run on error
     */
    async postRequest(urlPath, data, callback, onError) {
        var currentAPI = this;
        var attempt = 0;

        if (urlPath.startsWith("/")) {
            urlPath = urlPath.substring(1, urlPath.length);
        }



        const options = {
            url: "https://" + this.host + "/" + this.instance + this.webAPIRoot + urlPath, //URL of the instance
            headers: {
                'x-api-key': this.apiKey, //The API Key
                'accept': 'application/json', //Data is returned in JSON format
                'Content-Type': 'text/json', //Data is sent in JSON format
                'cp-datetime': api.currentDate() //The current datetime
            },
            body: JSON.stringify(data),
            //proxy: "http://127.0.0.1:8888",
            resolveWithFullResponse: true,
            method: "POST"
        }

        if (this._isAuthenticated) {
            options.headers.cookie = this.cookie;
        }
        try {
            var response = await this.requestLib.post(options);
            callback(response);
        } catch (error) {
            var timeoutWait = Util.InitialTimeoutWait;

            if (error !== undefined && error["statusCode"] == Util.StatusCode.Timeout && attempt < 3) {
                attempt++;
                /*If error is a timeout, then retry either after the given retry amount in Retry-After isn't set,
                otherwise use the time given  */
                if (error.response !== undefined && error.response.headers !== undefined && error.response.headers["retry-after"] !== undefined) {
                    var retryAfter = parseInt(error.response.headers["retry-after"], 10);
                    if (retryAfter != "NaN") {
                        timeoutWait = retryAfter * 1000;
                    }
                }
                await Util.timeout(timeoutWait);
                await currentAPI.postRequest(urlPath, data, callback, onError);
            } else {
                if (onError !== undefined) {
                    onError(error);
                }

            }
        }
    }



    /**
     *
     * @param {string} urlPath - The path to call from the url
     * @param {JSON|string} data - The data to send in the request
     * @param {function(object)} callback - function to run on succes
     * @param {function(object)} onError - function to run on error
     */
    postRequestV1(urlPath, data, callback, onError) {
        var currentAPI = this;
        var attempt = 0;

        if (urlPath.startsWith("/")) {
            urlPath = urlPath.substring(1, urlPath.length);
        }


        const options = {
            url: "https://" + this.host + "/" + this.instance + this.webAPIRoot + urlPath, //URL of the instance
            headers: {
                'x-api-key': this.apiKey, //The API Key
                'accept': 'application/json', //Data is returned in JSON format
                'Content-Type': 'text/json', //Data is sent in JSON format
                'cp-datetime': api.currentDate() //The current datetime
            },
            body: JSON.stringify(data),
            //proxy: "http://127.0.0.1:8888",
            resolveWithFullResponse: true,
            method: "POST"
        }

        if (this._isAuthenticated) {
            options.headers.cookie = this.cookie;
        }
        return this.requestLib.post(options).then(callback).catch(
            function(error) {
                var timeoutWait = Util.InitialTimeoutWait;

                if (error !== undefined && error["statusCode"] == Util.StatusCode.Timeout && attempt < 3) {
                    attempt++;
                    /*If error is a timeout, then retry either after the given retry amount in Retry-After isn't set,
                    otherwise use the time given  */
                    if (error.response !== undefined && error.response.headers !== undefined && error.response.headers["retry-after"] !== undefined) {
                        var retryAfter = parseInt(error.response.headers["retry-after"], 10);
                        if (retryAfter != "NaN") {
                            timeoutWait = retryAfter * 1000;
                        }
                    }
                    setTimeout(currentAPI.postRequest(urlPath, data, callback, onError), timeoutWait);
                } else {
                    if (onError !== undefined) {
                        onError(error);
                    }
                }



            }
        );
    }

    Asset = Asset;
    Util = Util;
    Workflow = Workflow;
}

module.exports = api;