const util = require('./util');

/**
 * An object that contains methods for getting and setting information about users
 */
class User {

    constructor(api) {
        this.api = api;
    }

    set api(api) {
        this._api = api;
    }

    /**
     * Get the list of users
     */
    async listUsers() {
        return await util.makeCall(this._api, "/User/getvisibleusers", {});
    }

    /**
     * Create a new user
     * @param {UserCreateRequest} userCreateRequest - the details of the user to be created
     */
    async createUser(userCreateRequest) {
        return await util.makeCall(this._api, "/User/createuser", userCreateRequest);
    }
}

/**
 * 
 */
 class UserCreateRequest {

    /**
     * Create a new request to create an user
     * @param {string} username - string containing username
     * @param {string} firstName - string containing first name
     * @param {string} lastName - string containing last name
     * @param {string} emailAddress - string containing email address
     * @param {string=} password - string containing password (defaults to null, and will be auto-generated)
     */
    constructor(username, firstName, lastName, emailAddress, password = null) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.emailAddress = emailAddress;
        this.password = password;
    }

    /**
     * @param {string} username - The username of the new user
     */
    set username(username) {
        this._username = username;
    }

    /**
     * @param {string} firstName - The first name of the new user
     */
    set firstName(firstName) {
        this._firstName = firstName;
    }

    /**
     * @param {string} lastName - The last name of the new user
     */
     set lastName(lastName) {
        this._lastName = lastName;
    }

    /**
     * @param {string} emailAddress - The email address of the new user
     */
    set emailAddress(emailAddress) {
        this._emailAddress = emailAddress;
    }

    /**
     * @param {string} password - The password for the new user. A falsey value will auto-generate a new password on creation
     */
    set password(password) {
        this._password = password;
    }
    
    /**
     * Return the object as a json object
     */
    toJson() {
        return {
            "userFields": {
                "username": this._username,
                "firstName": this._firstName,
                "lastName": this._lastName,
                "emailAddress": this._emailAddress,
                "password": this._password || null
            },
            "generateOneTimeUsePassword": (this._password && this._password.length > 0)
        };
    };
}

module.exports = User;