/* jshint esversion:6 */

/*
* General purpose OCAPI based module for interacting with the baskets resource
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/17.4/shop/Resources/Baskets.html?cp=0_11_3_0 
* A new instance of this object should be created for each separate client connection
* required and the re-used for all actions against that instance.
* 
* Created by: Lawrence Walters lwalters@lyonscg.com
* Updated by: Mike King mking@lyonscg.com
* - refactored to use a new ocapi.do helper method to reduce code duplication
* - added several new methods to enable full checkout 
*/
const TokenManager = require('./tokenManager');
const ocapi = require('./ocapi');

var Baskets = function(clientID, clientPassword, host, tokenManager, version="v18_2") {
    this.clientID = clientID;
    this.clientPassword = clientPassword;
    this.host = host;
    this.version = version;
    
    // Create a new OAUTH2 token manager to track token lifetime and re-auth as needed
    this.tokenMgr = tokenManager || new TokenManager(clientID,clientPassword);
};

Baskets.prototype.createBasket = function(siteId, inToken) {
    return ocapi.do(this, siteId, inToken, "shop", "/baskets", "POST");
};


Baskets.prototype.getBasket = function(basketId, siteId) {
    var resource = `baskets/${basketId}/items`;
    return ocapi.do(this, siteId, inToken, "shop", resource, "GET");
};


Baskets.prototype.postItems = function(basketId, body, inToken, siteId) {
    var resource = `baskets/${basketId}/items`;
    return ocapi.do(this, siteId, inToken, "shop", resource, "POST", body);
};

Baskets.prototype.setShippingAddress = function(basketId, shipmentId, body, inToken, siteId) {
    var resource = `baskets/${basketId}/shipments/${shipmentId}`;
    return ocapi.do(this, siteId, inToken, "shop", resource, "PATCH", body);
};

Baskets.prototype.setBillingAddress = function(basketId, body, inToken, siteId){
    var resource = `baskets/${basketId}/billing_address`;
    return ocapi.do(this, siteId, inToken, 'shop', resource, "PUT", body);
};

Baskets.prototype.addPaymentInstrument = function(basketId, body, inToken, siteId){
    var resource = `baskets/${basketId}/payment_instruments`;
    return ocapi.do(this, siteId, inToken, 'shop', resource, "POST", body);
};

Baskets.prototype.deleteBasket = function(basketId, inToken, siteId) {
    return ocapi.do(this, siteId, inToken, "shop", `/baskets/${basketId}`, "DELETE");
};

module.exports = Baskets;