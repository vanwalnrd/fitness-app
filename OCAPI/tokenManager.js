/*
* This helper library manages OCAPI OAUTH2 tokens used to authenticate with 
* various resources. It should be instantiated once and re-used as much as 
* possible for a particular set of client credentials to avoid unnecessary 
* traffic to the auth server.
* 
* Created by: Mike King mking@lyonscg.com
*
* TODO:
* - Figure out if there's need to support BM User Grant as well as 
*   Client Credentials Grant with this library and, if necessary, 
*   implement that as an option
*
*/
var clientCredentialsGrant = require('./clientCredentialsGrant');
var businessManagerUserGrant = require('./businessManagerUserGrant');

var Promise = require('promise');

// OAUTH2 tokens expire after 30 minutes
const TOKEN_EXPIRATION_MINUTES = 25;

/*
* Create a new instance of this class with the OCAPI client ID and 
* client password. You can learn more about the use of OAUTH2 in OCAPI here:
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/16.9/usage/OAuth.html?cp=0_9_2_19
* 
* For Client Grants, include clientID, clientPassword only.
* For Business Manager User grants, ALSO include user, password, host. 
*
*
* When targeting Sandbox instances the test client ID and password can be used:
* clientID: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
* clientPassword: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
* 
* When targeting Primary Instance Group (PIG) instances you need a properly registered
* OCAPI Client ID:
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/AccountManager/AccountManagerAddAPIClientID.html
*
*/
var TokenManager = function(clientID, clientPassword, user, password, host) {
    this.clientID = clientID;
    this.clientPassword = clientPassword;
    this.user = user;
    this.password = password;
    this.host = host;
    
    // start with no token so an auth will be required on the first call
    this.token = '';
    this.tokenUpdated = '';
};

TokenManager.prototype.setToken = function(token) {
    this.token = token;
    this.tokenUpdated = Date.now();
};

/*
* This is the primary method used to wrap any function requiring a valid 
* OAUTH2 token as a parameter. It will take care of passing in an existing 
* valid token if one is available or re-authing and then calling if necessary.
*/
TokenManager.prototype.getToken = function() {
    var clientID = this.clientID;
    var clientPassword = this.clientPassword;
    var tokenUpdated = this.tokenUpdated;
    var current = this;
    var existingToken = this.token;
    var user = this.user;
    var password = this.password;
    var host = this.host;
    return new Promise(function(fulfill, reject) {
    // see if we have an expired token
        var tokenExpired = 
            tokenUpdated && 
            (Date.now()-tokenUpdated)/1000/60 > TOKEN_EXPIRATION_MINUTES;

        // if we have no token or we have an expired token, get a new one
        if (!existingToken || tokenExpired){
            // BM user grant
            if(user && !user.empty) {
              businessManagerUserGrant.getGrant(clientID, clientPassword, user, password, host)
              .then(token=>{
                  current.setToken(token);
                  fulfill(token);
              },error=>reject(error));
            } else {
              // client grant
              clientCredentialsGrant.getGrant(clientID, clientPassword)
              .then(token=>{
                  current.setToken(token);
                  fulfill(token);
              },error=>reject(error));
            }
        }else {
            fulfill(existingToken);
        }
    });
};

module.exports = TokenManager;