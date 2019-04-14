/* jshint esversion:6 */

var path = require("path");
var fs = require("fs");

exports.readOCAPIConfig = function () {
    console.log("Reading Configuration Data");

    var env = process.env.NODE_ENV || 'development';
    console.log(env);
    var config = null;
    try {
        config = require('./ocapiConfig')[env];
    } catch (e) {
        console.error('Unable to retrieve ocapiConfig.js');
        console.error(e);
        return null;
    }
    console.log("ocapiConfig found: " + JSON.stringify(config));
    // ensure required environment config variables are set
    var requiredProperties = ['clientId', 'clientPassword', 'host', 'siteId'];
    var verifyOCAPI = (property) => verifyExists(property, config, 'ocapiConfig.js');
    if (!requiredProperties.every(verifyOCAPI)) return null;

    return config;
};

exports.readCheckoutConfig = function (requiredProperties) {
    var checkoutConfig = null;
    var checkoutConfigFileName = null;
    if (process.argv.length > 2) {
        // allow the checkout config file to be passed in as a command line argument
        checkoutConfigFileName = process.argv[2];
        if (!path.isAbsolute(checkoutConfigFileName)) {
            checkoutConfigFileName = path.join(__dirname, checkoutConfigFileName);
        }
    } else {
        console.error("The checkout config JSON file name must be passed in as the first argument");
        return false;
    }
    console.log(`Reading configuration from file: ${checkoutConfigFileName}`);
    try {
        var content = fs.readFileSync(checkoutConfigFileName);
        checkoutConfig = JSON.parse(content);
    } catch (e) {
        console.error(`Could not find file ${checkoutConfigFileName}`);
        console.error(e);
        return false;
    }

    // verify all required checkout configuraton files are populated in the config
    var verifyCheckout = (property) => verifyExists(property, checkoutConfig, 'checkoutConfig.json');
    if (!requiredProperties.every(verifyCheckout)) return false;

    return checkoutConfig;
};


// test to verify configuration property is set 
function verifyExists(property, obj, fileName) {
    if (obj[property]) {
        console.log(`* ${property}: ${obj[property]}`);
        return true;
    } else {
        console.error(`${property} not found in ${fileName}`);
        return false;
    }
}