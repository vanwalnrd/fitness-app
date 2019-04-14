/*
* This helper library manages the Business Manager user Grant auth type for OCAPI.

User Login:User Password:Client Password

REQUEST:
POST /dw/oauth2/access_token?client_id=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken HTTP/1.1
Host: example.com
Authorization: Basic TXlMb2dpbjpNeVBhc3N3cmQ6TXlDbGllbnRTZWNyZXQ=
Content-Type: application/x-www-form-urlencoded

TODO: respect the 'expires_in' property of the returned JSON data
response:
{
  "access_token":"ae28d322-b9c1-4fba-ae7d-d0ab6eeb9bd5",
  "expires_in":899,
  "token_type":"Bearer"
}

*/

var https = require('https'); 
var querystring = require('querystring');
var Promise = require('promise');

/* 
* The 'callback' parameter is required and should have the signature (error, token) where error 
* will contain any errors that occured as part of the request and token will contain the new 
* access token if no errors occured.
*/
function getGrant(clientID, clientPassword, user, password, host){
    var options = {
        hostname:host,
        method:"POST",
        path:"/dw/oauth2/access_token",
        protocol:"https:",
        port:443,
        auth:user+":"+password+":"+clientPassword,
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
                try {
                    var parsedData = JSON.parse(data);
                    if (parsedData.error) {
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
              "client_id":clientID,
              "grant_type":"urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken"
            })
        );
        request.end();
    });
}

exports.getGrant = getGrant;