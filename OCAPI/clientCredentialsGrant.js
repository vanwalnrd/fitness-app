/*
* This helper library manages the Client Credentials Grant auth type for OCAPI.
* This auth type only requires a client ID and client password registered with 
* https://account.demandware.com/ no Business Manager user account needs to be 
* configured. Technically this is best for server-to-server scenarios where 
* no end user is involved but it's easier to setup and manager so it's being used 
* here until there's a need for BM User Grant.
* 
* Created by: Mike King mking@lyonscg.com
*
* TODO:
*
*/

var https = require('https'); 
var querystring = require('querystring');
var Promise = require('promise');

/* 
* Call this function with a valid OCAPI client ID and 
* client password. You can learn more about the use of OAUTH2 in OCAPI here:
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/16.9/usage/OAuth.html?cp=0_9_2_19
* 
* When targeting Sandbox instances the test client ID and password can be used:
* clientID: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
* clientPassword: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
* 
* When targeting Primary Instance Group (PIG) instances you need a properly registered
* OCAPI Client ID:
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/AccountManager/AccountManagerAddAPIClientID.html
*
* This function does not cache the resulting token and should be wrapped by an instance of TokenManager
* to handle token caching.
* 
* The 'callback' parameter is required and should have the signature (error, token) where error 
* will contain any errors that occured as part of the request and token will contain the new 
* access token if no errors occured.
*/
function getGrant(clientID, clientPassword){
    var options = {
        hostname:"account.demandware.com",
        method:"POST",
        path:"/dw/oauth2/access_token",
        protocol:"https:",
        port:443,
        auth:clientID+":"+clientPassword,
        headers:{
            "Content-Type":"application/x-www-form-urlencoded"
        }
    };
    return new Promise(function(fulfill, reject) {
        var request = https.request(options,(res)=>{
            res.setEncoding('utf8');
            var data = '';
            res.on('data',(chunk)=>{
                data+=chunk;
            })
            res.on('end',() => {
                /*
                TODO: respect the 'expires_in' property of the returned JSON data
                {
                    "access_token": "30d9eda1-84d0-4a06-9a2d-6fc2351bf4c1",
                    "scope": "mail",
                    "token_type": "Bearer",
                    "expires_in": 1799
                }
                */
                try {
                    var parsedData = JSON.parse(data);
                    if (parsedData.error) {
                        parsedData['_clientGredentialsGrantOptions'] = options;
                        reject(parsedData);
                    }else {
                        fulfill(parsedData.access_token);
                    }
                }catch (e) {
                    reject(e);
                }
            });
        });
        request.on('error',(e)=>{
            reject(`problem with request: ${e.message}`,'');
        });
        request.write(
            querystring.stringify({
            "grant_type":"client_credentials" 
            })
        );
        request.end();
    });
}

exports.getGrant = getGrant;