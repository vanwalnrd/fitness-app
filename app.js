/*jshint esversion: 6 */
'use strict';

const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Util = require('./util');
const OCAPIConfig = Util.readOCAPIConfig();
const ProductSearch = require('./OCAPI/product_search');
const productSearch = new ProductSearch(OCAPIConfig.clientId, OCAPIConfig.siteId, OCAPIConfig.host, OCAPIConfig.version);

var text = '';
var messageData;

if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}


app.set('port', (process.env.PORT || 4988))

//serve static files in the public directory
app.use(express.static('public'));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
});

app.post('/webhook/', (req, res) => {

	var data = req.body;
	console.log("Request Received: " + JSON.stringify(data));
	
	var actionName = data.queryResult.intent.displayName;
		
	switch (actionName) {
		case 'test':
			{
				text = "Response from Heroku";
				messageData = {
					fulfillmentText: text
				};
				res.send(messageData);
			}
			break;
		case 'looking-for':
			{
				console.log("Looking For Search");
				var query = data.queryResult.parameters.query;
				productSearch.search(query,(err,data)=> {
					if (err){
						messageData = {
							fulfillmentText: err
						};
					}else if (data.count == 0) {
						messageData = {
							fulfillmentText: "No results found for: " + query;
						};
					}else {
						// results retrieved 
						var fulfillmentMessages = [];
						for(let i = 0; i < data.count; i++){
							var result = data.hits[i];
							fulfillmentMessages.push({
								card: {
									title: result.product_name,
									subtitle: result.price,
									imageUri: result.image.link
								}
							});
						}
						messageData = {
							fulfillmentMessages: fulfillmentMessages
						};
					}
					res.send(messageData);
				});
			}
			break;
		default:
			//unhandled action
			break;
	}
});


// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
