/*jshint esversion: 6 */
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Util = require('./util');
const config = Util.readOCAPIConfig();
const ProductSearch = require('./OCAPI/product_search');
const siteID = config.siteId;
const productSearch = new ProductSearch(config.clientId, siteID, config.host, config.version);
const Customers = require('./OCAPI/customers');
const customers = new Customers(config.clientId,config.clientPassword,config.host,null,config.version);
const Baskets = require('./OCAPI/baskets');
const baskets = new Baskets(config.clientId,config.clientPassword,config.host, null, config.version);

var text = '';
var messageData;

app.set('port', (process.env.PORT || 4988))

//serve static files in the public directory
app.use(express.static('public'));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
	console.log('Hello world hit!');
	res.send('Hello world, I am a chat bot');
});

app.post('/webhook/', (req, res) => {

	var data = req.body;
	console.log("Request Received: " + JSON.stringify(data));

	var actionName = data.queryResult.intent.displayName;

	switch (actionName) {
		case 'test':
			testResponse(res);
			break;
		case 'looking-for':
			lookingFor(data, res);
			break;
		case 'add-to-cart':
			addToCart(data, res);
			break;
		default:
			//unhandled action
			break;
	}
});


// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
});

function addToCart(data, res) {
	var authorization = null;
	var basketId = null;

	var productID =  data.queryResult.parameters.productid;
	var products = [{
		product_id:productID,
		quantity:1
	}];


	customers.auth(config.siteId, {type:'guest'},null).then(data => {
		// now get a basket for that customer
		authorization = data.authorization;
		return baskets.createBasket(config.siteId, authorization);
	}).then(data=>{
		// basket created successfully
		basketId = data.basket_id;
		console.log('Basket created: ' + basketId);
		// now add products to the basket
		return  baskets.postItems(basketId, products, authorization, siteID);
	}).then(data=>{
		messageData = {
			fulfillmentText: productID + " added"
		};
		res.send(messageData);
	}).catch(reason=>{
		console.error(reason);
		messageData = {
			fulfillmentText: "Error: " + reason
		};
		res.send(messageData);
	});
}

function lookingFor(data, res) {
	console.log("Search triggered for: " + query);
	var query = data.queryResult.parameters.query;
	productSearch.search(query, (err, data) => {
		if (err) {
			messageData = {
				fulfillmentText: err
			};
		}
		else if (data.count == 0) {
			messageData = {
				fulfillmentText: "No results found for: " + query
			};
		}
		else {
			// results retrieved 
			var fulfillmentMessages = [];
			for (let i = 0; i < data.count; i++) {
				var result = data.hits[i];
				fulfillmentMessages.push({
					card: {
						title: result.product_id + ": " + result.product_name,
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

function testResponse(res) {
	text = "Response from Heroku";
	messageData = {
		fulfillmentText: text
	};
	res.send(messageData);
}

