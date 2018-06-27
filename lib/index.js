const crypto = require('crypto');
const request = require('request-promise');

class PTApi {
    /**
     * A new API interface
     * @constructor
     * @param {String} apiurl - Base API URL
     * @param {String} apitoken - API token
     */
    constructor(apiurl, apitoken) {
        if(!apiurl || !apitoken) throw new Error('You must pass a url and API key to the constructor!');
        this.url = apiurl;
        this.token = apitoken;
        this.header = { auth: { bearer: this.token }, 'Content-Type': 'application/json', 'Accept': 'application/vnd.pterodactyl.v1+json' };
    }

    /**
     * Generates the authentication header.
     * @async
     * @deprecated
     * @param {String} url - URL
     * @param {String} body - Body
     * @param {String} pubkey - Public key
     * @param {String} privkey - Private key
     * @returns {String} Built auth header
     * @throws {Error} Any errors
     */
    getAuthHeader(url, body, pubkey, privkey) {
        return new Promise(async (resolve, reject) => {
            reject(new Error('This function is deprecated as it serves no purpose on the latest version of the panel.'));
            if(!url || !body || !pubkey || !privkey) reject(new Error('Missing one or more parameters!'));
            let hmac = crypto.createHmac('sha256', privkey);
            hmac.write(url + body);
            hmac.end();
            let hash = hmac.read().toString('base64');
            resolve(`${pubkey}.${hash}`);
        });
    }

    // User related functions

    /**
     * Get all users
     * @async
     * @returns {PTUser[]} - Array of users
     * @throws {Error} - Any errors that happen
     */
    getUsers() {
        return new Promise(async (resolve, reject) => {
            const url = this.url + '/api/application/users';
            try {
                const resp = await request.get(url, { auth: { bearer: this.token }, json: true, resolveWithFullResponse: true });
                if(resp.statusCode !== 200) reject(new Error(`Non-200 status code ${resp.statusCode}`));
                if(resp.body.error) reject(new Error(`Error: ${resp.body.error}`));
                resolve(resp.body.data);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get a single user
     * @async
     * @param {String} id - ID of the user
     * @returns {PTUser?} - User
     * @throws {Error} - Any errors that happen
     */
    getUser(id) {
        return new Promise(async (resolve, reject) => {
            if(!id) reject(new Error('You mast pass a user ID!'));
            const url = `${this.url}/api/application/users/${id}`;
            try {
                const resp = await request.get(url, { auth: { bearer: this.token }, json: true, resolveWithFullResponse: true });
                if(resp.statusCode === 404) resolve(null);
                if(resp.statusCode !== 200) reject(new Error(`Non-200 status code ${resp.statusCode}`));
                if(resp.body.error) reject(new Error(`Error: ${resp.body.error}`));
                resolve(resp.body);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Get a single user by external ID
     * @async
     * @param {String} id - External ID of the user
     * @returns {PTUser?} - User
     * @throws {Error} - Any errors that occur
     */
    getUserByExternalId(id) {
        return new Promise(async (resolve, reject) => {
            if(!id) reject(new Error('You must specify an ID'));
            const url = `${this.url}/api/application/users/external/${id}`;
            try {
                const resp = await request.get(url, { auth: { bearer: this.token }, json: true, resolveWithFullResponse: true });
                if(resp.statusCode === 404) resolve(null);
                if(resp.statusCode !== 200) reject(new Error(`Non-200 status code ${resp.statusCode}`));
                if(resp.body.error) reject(new Error(`Error: ${resp.body.error}`));
                resolve(resp.body);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Creates a user
     * @async
     * @param {Object} user - User to add
     * @param {String} user.email - Email for new user
     * @param {String} user.username - Username for new user
     * @param {String} user.first_name - First name for new user
     * @param {String} user.last_name - Last name for new user
     * @param {String} [user.password] - Password for the new user
     * @param {Boolean} [user.root_admin=false] - Admin status for the new user
     * @param {String} [user.language] - Optional language for the new user
     * @param {String} [user.external_id] - New user's external ID
     * @returns {PTUser} New user
     */
    createUser(user) {
        return new Promise(async (resolve, reject) => {
            if(!user || !user.email || !user.username || !user.first_name || !user.last_name) reject(new Error('You must specify the user\'s email, username, and first and last names. If left blank, password will be generated by the server'));
            const url = this.url + '/api/application/users';
            try {
                const resp = await request.post(url, { auth: { bearer: this.token }, body: user, json: true, resolveWithFullResponse: true });
                if(resp.statusCode === 422) reject(new Error(`Validation error on object ${user}`));
                if(resp.statusCode === 503) reject(new Error('Panel encountered an error while processing the request'));
                if(resp.body.error) reject(new Error(`Error: ${resp.body.error}`));
                resolve(resp.body.id);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Update a user
     * @async
     * @param {String} - ID of user to update
     * @param {Object} user - New user object
     * @param {String} user.username - User's new username
     * @param {String} user.email - User's new email
     * @param {String} user.first_name - User's new first name
     * @param {String} user.last_name - User's new last name
     * @param {String} user.password - User's new password
     * @param {String} user.root_admin - User's admin status
     * @returns {PTUser} The updated user
     * @throws {Error} Any errors
     */
    updateUser(id, user) {
        return new Promise(async (resolve, reject) => {
            const url = `${this.url}/api/application/users/${id}`;
            try {
                const resp = await request.patch(url, { auth: { bearer: this.token }, json: true, resolveWithFullResponse: true, body: user });
                if(resp.statusCode === 404) reject(new Error('Can\'t update non-existant user!'));
                if(resp.statusCode !== 200) reject(new Error(`Non-200 status code ${resp.statusCode}`));
                if(resp.body.error) reject(new Error(`Error: ${resp.body.error}`));
                resolve(resp.body);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Delete a user
     * @async
     * @param {String} id ID of user to delete
     * @throws {Error} Any errors that occur
     */
    deleteUser(id) {
        return new Promise(async (resolve, reject) => {
            if(!id) reject(new Error('Must specifiy a user ID'));
            const url = `${this.url}/api/application/users/${id}`;
            try {
                const resp = await request.delete(url, { auth: { bearer: this.token }, resolveWithFullResponse: true });
                if(resp.statusCode !== 204) reject(new Error(`Got a non-204 response: ${resp.statusCode}`));
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    // Nest related functions

    getNests() {
        return new Promise(async (resolve, reject) => {
            const url = this.url
        });
    }

}

/**
 * @typedef {Object} PTUser
 * @property {String} object - Account type
 * @property {Object} attributes Attrributes
 * @property {Number} attributes.id User's ID
 * @property {String?} attributes.external_id User's external ID
 * @property {String} attributes.uuid The user's UUID
 * @property {String} attributes.username The user's username
 * @property {String} attributes.email The user's email
 * @property {String} attributes.first_name The user's first name
 * @property {String} attributes.last_name The user's last name
 * @property {String} attributes.language The user's language
 * @property {Boolean} attributes.root_admin Is the user root admin
 * @property {Boolean} attributes.2fa Does the user use 2fa
 * @property {String} attributes.created_at When the user's profile was created
 * @property {String} attributes.updated_at When the user's profile was last updated
 */

/**
 * @typedef {Object} PTServer
 * @property {String} type - Type
 * @property {String} id - Server ID
 * @property {Object} attributes - Attributes
 * @property {String} attributes.uuid Server's UUID
 * @property {String} attributes.uuidShort Server's short UUID
 * @property {Number} attributes.node_id Server's node ID
 * @property {String} attributes.name Server's name
 * @property {String} attributes.description Server's description
 * @property {Boolean} attributes.skip_scripts Skip scripts
 * @property {Boolean} attributes.suspended Server suspended
 * @property {Number} attributes.owner_id Owner's user ID
 * @property {Number} attributes.memory Server's RAM size (in MB)
 * @property {Number} attributes.swap Server's swap size (in MB)
 * @property {Number} attributes.disk Server's disk space (in MB)
 * @property {Number} attributes.io Block IO number
 * @property {Number} attributes.cpu CPU limit number
 * @property {Boolean} attributes.oom_disabled OOM status
 * @property {Number} attributes.allocation_id Server's allocation ID
 * @property {Number} attributes.service_id Server's service ID
 * @property {Number} attributes.option_id Server's option ID
 * @property {Number?} attributes.pack_id Server's pack ID
 * @property {String} attributes.startup Command server runs on startup
 * @property {String} attributes.image Server's base image
 * @property {String} attributes.username Server's op login
 * @property {Boolean} attributes.installed Server's installed status
 * @property {String} attributes.created_at Server's creation date
 * @property {String} attributes.updated_at Server's update date
 */

/**
 * @typedef PTNest
 * @property {String} object - Type of object
 * @property {Object} attributes - Attributes
 * @property {Number} attributes.id - Nest ID
 * @property {String} attributes.uuid - Nest UUID
 * @property {String} attributes.author - Nest's author
 * @property {String} attributes.name - Nest's name
 * @property {String} attributes.description - Nest's description
 * @property {String} attributes.created_at - Creation timestamp
 * @property {String} attributes.updated_at - Update timestamp
 */

module.exports = PTApi;