/*jshint esversion: 6 */

/*
* General purpose OCAPI based module for interacting with the Product Search  resource
* https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/19.3/shop/Resources/ProductSearch.html?cp=0_12_3_14
* A new instance of this object should be created for each separate client connection
* required and the re-used for all actions against that instance.
* 
* Created by: Mike King mking@lyonscg.com
*/
var TokenManager = require('./tokenManager');
var https = require('https');

/*
* Create a new instance of this class with the OCAPI client ID and 
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
* The host parameter should be the host portion of the instance URL only.
* host: dev01-us-client.demandware.net
* 
* If you are targeting a specific version of the OCAPI framework you can pass in the version 
* string using the 'version' parameter (e.g. "v16_9"). The default is v16_9.
* 
* All methods on this library are fully asynchronous and callback methods using a standard 
* signature (err, response) should be supplied if actions need to be taken when complete.
* 
* TODO:
*
* - Calling applications should have the option of supplying a TokenManager instance instead of 
*   a clientPassword so that token lifetime can be managed at the application level.
* 
* - Evaluate a better async model (return Promise? asyncawait?) for consistency and ease of use
*/
var ProductSearch = function(clientID, siteID, host, version="v19_2") {
    this.clientID = clientID;
    this.host = host;
    this.siteID = siteID;
    this.version = version;
};

/*
* Wraps the Data API's Libraries resource PATCH method against the following endpoint:
* /libraries/{library_id}/content/{content_id}
* 
* The libraryID and contentID must be supplied along with a properly formatted ContentAsset
* JSON document object to update the current content of the asset:
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/16.9/data/Documents/ContentAsset.html#id1941584777
*
* If the optional 'callback' parameter is supplied it should take two parameters. The first parameter
* will have any errors that occured during the request, the second will contain the JSON object 
* returned by the server (also a ContentAsset document following the above linked spec).
*
* TODO:
* - Ensure this will create a new asset if one does not exist
*/
ProductSearch.prototype.search = function(query, callback) {
    // This method ensures that a valid token is always used for the request 
    // and will request a new one if the existing has expired or if none are stored.
    var options = {
        hostname:this.host,
        method:"GET",
        path:`/s/${this.siteID}/dw/shop/${this.version}/product_search?client_id=${this.clientID}&q=${query}`,
        protocol:"https:",
        port:443,
        headers:{
            "Content-Type":"application/json"
        }
    };
    var request = https.request(options,(res)=>{
        res.setEncoding('utf8');
        var data = '';
        res.on('data',(chunk)=>{
            data+=chunk;
        })
        res.on('end',() => {
            //console.log(data);
            if(typeof(callback) == 'function') {
                callback('',JSON.parse(data));
            }
        });
    });
    request.on('error',(e)=>{
        //console.log("error: " + e);
        if (typeof(callback) == 'function') {
            callback(`problem with request: ${e.message}`,'');
        }
    });
    request.end();
};

module.exports = ProductSearch;