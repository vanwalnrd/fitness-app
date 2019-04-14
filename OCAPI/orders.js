/* jshint esversion:6 */

/*
* General purpose OCAPI based module for interacting with the baskets resource
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/17.4/shop/Resources/Orders.html?cp=0_11_3_0 
* A new instance of this object should be created for each separate client connection
* required and the re-used for all actions against that instance.
* 
* Created by: Mike King mking@lyonscg.com
*/
const TokenManager = require('./tokenManager');
const ocapi = require('./ocapi');

var Orders = function(clientID, clientPassword, host, tokenManager, version="v18_2") {
    this.clientID = clientID;
    this.clientPassword = clientPassword;
    this.host = host;
    this.version = version;
    
    // Create a new OAUTH2 token manager to track token lifetime and re-auth as needed
    this.tokenMgr = tokenManager || new TokenManager(clientID,clientPassword);
};

Orders.prototype.createFromBasket = function(body, inToken, siteId){
    return ocapi.do(this, siteId, inToken, 'shop', "orders", "POST", body);
};

Orders.prototype.updateOrder = function(body, inToken, siteId, orderNo) {
    return ocapi.do(this, siteId, inToken, "shop", `orders/${orderNo}`,"PATCH",body);
};

Orders.prototype.authorizePaymentInstrument = function(body, inToken, siteId, orderNo, paymentInstrumentId) {
    var resource = `orders/${orderNo}/payment_instruments/${paymentInstrumentId}`;
    return ocapi.do(this, siteId, inToken, "shop", resource, "PATCH", body);
};

module.exports = Orders;