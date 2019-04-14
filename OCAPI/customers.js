/* jshint esversion:6 */

/*
* General purpose OCAPI based module for interacting with the Libraries resource
* https://documentation.demandware.com/DOC1/topic/com.demandware.dochelp/OCAPI/16.9/data/Resources/Libraries.html?cp=0_9_4_28
* A new instance of this object should be created for each separate client connection
* required and the re-used for all actions against that instance.
* 
* Created by: Mike King mking@lyonscg.com
*/
const TokenManager = require('./tokenManager');
const ocapi = require('./ocapi');

var Customers = function(clientID, clientPassword, host, tokenManager, version="v17_4") {
    this.clientID = clientID;
    this.clientPassword = clientPassword;
    this.host = host;
    this.version = version;
    
    // Create a new OAUTH2 token manager to track token lifetime and re-auth as needed
    this.tokenMgr = tokenManager || new TokenManager(clientID,clientPassword);
};

Customers.prototype.searchCustomers = function(listID, query) {
    return ocapi.do(this, "-", null, "data", `customer_lists/${listID}/customer_search`,"POST",query);
};

Customers.prototype.updateCustomer = function(listID, customerID, updateDoc,inToken) {
    return ocapi.do(this, "-", inToken, "data",`customer_lists/${listID}/customers/${customerID}`, "PATCH", updateDoc);
};

Customers.prototype.getCustomer = function(listID, customerID) {
    return ocapi.do(this, "-", null, "data", `customer_lists/${listID}/customers/${customerID}`, "GET");
};

Customers.prototype.getCustomerAddresses = function(listID, customerID) {
    return ocapi.do(this, "-", null, "data", `customer_lists/${listID}/customers/${customerID}/addresses`, "GET");
};

Customers.prototype.createCustomer = function(query, inToken) {
    return ocapi.do(this, "-", inToken, "shop", "customers", "POST", query);
};

Customers.prototype.getBaskets = function(siteId, inToken, customerId) {
    return ocapi.do(this, siteId, inToken, "shop", `customers/${customerId}/baskets`, "GET");
};

Customers.prototype.auth = function(siteId, query, inToken) {
    return ocapi.do(this, siteId, inToken, "shop", "customers/auth", "POST", query, (parsedData, res)=>{
        return { "authorization": res.headers.authorization.replace('Bearer ',''), "parsedData": parsedData };
    }, "Basic");
};

module.exports = Customers;