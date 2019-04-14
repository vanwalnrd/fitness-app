/* jshint esversion:6 */

/*
* OCAPI wrapper function for creating well formed requests that include an auth token
* and handle retries on failure automatically. Used by other libraries
*/

const https = require('https');
const tls = require('tls');

function doOCAPI(config, siteId, inToken, apiType, resource, method, body, successProcessor, authType) {
    var version = config.version;
    var clientID = config.clientID;
    var host = config.host;
    var tokenMgr = config.tokenMgr;
    if (!authType) {
        authType = "Bearer";
    }
    return new Promise(function(fulfill,reject) {
        var withToken = function (token) {
            var options = {
                hostname:host,
                method:method,
                path:`/s/${siteId}/dw/${apiType}/${version}/${resource}?client_id=${clientID}`,
                port:443,
                headers:{
                    "Content-Type":"application/json",
                    "Authorization":`${authType} ${token}`
                }
            };
            var request = https.request(options,(res)=>{
                res.setEncoding('utf8');
                var data = '';
                res.on('data',(chunk)=>{
                    data+=chunk;
                });
                res.on('end', () => {
                    try {
                        var parsedData = JSON.parse(data);
                        if (parsedData.error || parsedData.fault) {
                            reject(parsedData);
                        }else {
                            if (successProcessor) {
                                 parsedData = successProcessor(parsedData, res);
                            }
                            fulfill(parsedData);
                        }
                    } catch(e) {
                      console.log(e);
                      reject(e);
                    }
                });
            });
            request.on('error',(e)=>{
                reject(`problem with request: ${e.message}`,'');
            });
            if (body){
                var bodyString = JSON.stringify(body);
                request.write(bodyString);
            }
            request.end();
        };
        if (inToken) {
            withToken(inToken);
        }else   {
            tokenMgr.getToken().then(withToken,
            err=>{
                console.log(err);
            });
        }
    });
}

exports.do = doOCAPI;