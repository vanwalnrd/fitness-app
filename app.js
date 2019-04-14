'use strict';

const apiai = require('apiai');
const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const sfcc = require('./sfcc-apis.js');
const sfmc = require('./sfmc.js');
const mailer = require('./mailer.js');
const jwtdecode = require('jwt-decode');
const app = express();

var token = '';
var text = '';
var basketId;
var customer_id;
var emailId;
var orderTotal;
var customerName;
var custLastName;
var customer_address_id;
var messageData;
var messageId;
var email = 'mike.e.king@gmail.com';
var password; //= 'mickeyd.mcd321@gmail.com';
debugger;


if (!config.API_AI_CLIENT_ACCESS_TOKEN) {
	throw new Error('missing API_AI_CLIENT_ACCESS_TOKEN');
}
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

function notify(emailId, messageId) {
	console.log("In notify-  " + emailId + ': ' + messageId);
};

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
				}
				res.send(messageData);
			}
			break;
		case 'shoes-in-stock':
			{
				console.log("In shoes-in-stock");
				if (isDefined(actionName)) {
					var idtoken = req.body.originalRequest.data.user.idToken;
					var decoded = jwtdecode(idtoken);
					//console.log(decoded);
					if (decoded.iss == 'https://accounts.google.com') {
						email = decoded.email;
						password = decoded.email;
						console.log(email + '   ' + password)
					}
					var passwordTest = password.charAt(0).toUpperCase() + password.slice(1);
					console.log(passwordTest);
					sfcc.getAuthTokenService(email, passwordTest, (error, result) => {
						if (error) {
							console.log(error);
						} else {
							customer_id = result.customer_id
							token = result.token
							emailId = result.email
							customerName = result.first_name
							custLastName = result.last_name
							sfcc.createCartService(result.token, (error, cartResult) => {
								if (error) {
									console.log(error);
								} else {
									basketId = cartResult.basketId;
									//console.log(result.token+' '+result.customer_id+" "+result.email);
									text = "Yes, there is currently a promotion - they are at 200 swiss francs until the end of the month and are available at your usual Cap Sports Style store. Same color as current one";
									messageData = {
										speech: text,
										displayText: text
									}
									res.send(messageData);
								}
							});
						}
					});
				}
			}
			break;
		case 'shoes-in-stock-order':
			{
				console.log('In shoes-in-stock-order');
				console.log(basketId + "  " + token);
				mailer.sendMailService(emailId, customerName, custLastName);
				if (isDefined(actionName)) {
					var productName = req.body.result.contexts[0].parameters.sportsProducts
					if (productName == 'Gloves') {
						var product_id = '0001TG250001';
						messageId = 'MTY0OjExNDow';
						sfcc.addProductsToCart(token, product_id, basketId, (error, result) => {
							if (error) {
								console.log(error);
							} else {
								console.log(result.responseCode);
								notify(emailId, messageId);
								//setTimeout(() => pushNotification(deviceIdJ), 3000);
								text = "I am sending you the options, please check on your app.";
								messageData = {
									speech: text,
									displayText: text
								}
								res.send(messageData);
							}
						});

						sfmc.getAuthTokenService((error, result) => {
							if (error) {
								console.log(error);
							} else {
								deviceAccessToken = result.accessToken;
								console.log(result.accessToken);
							}
						});
					} else if (productName == 'Jackets') {
						var product_id = '883360541099';
						messageId = 'MTgwOjExNDow';
						sfcc.addProductsToCart(token, product_id, basketId, (error, result) => {
							if (error) {
								console.log(error);
							} else {
								console.log(result.responseCode);
								notify(emailId, messageId);
								//setTimeout(() => pushNotification(), 3000);
								text = "I am sending you the options, please check on your app.";
								messageData = {
									speech: text,
									displayText: text
								}
								res.send(messageData);
							}
						});

						sfmc.getAuthTokenService((error, result) => {
							if (error) {
								console.log(error);
							} else {
								deviceAccessToken = result.accessToken;
								console.log(result.accessToken);
							}
						});
					}
					//mailer.sendMailService(emailId, customerName);
				}
			}
			break;

		case 'check_color':
			{
				console.log("In check_color");
				if (isDefined(actionName)) {
					sfcc.getAddressService(token, customer_id, (error, addressResult) => {
						if (error) {
							console.log(error);
						} else {
							customer_address_id = addressResult.customer_address_id;
							sfcc.setShipmentService(token, customer_address_id, basketId, (error, result) => {
								if (error) {
									console.log(error);
								} else {
									console.log(result.responseCode);
									text = "I think this color is the best one to fit with your shoes and pant. You will look awesome with them.";
									messageData = {
										speech: text,
										displayText: text
									}
									res.send(messageData);
								}
							});

						}
					});
				}
			}
			break;

		case 'color-confirmed':
			{
				console.log("In color-confirmed");
				if (isDefined(actionName)) {
					sfcc.setShipmentIdService(token, basketId, (error, result) => {
						if (error) {
							console.log(error);
						} else {
							orderTotal = result.product_total;
							text = "I assume I need express delivery so you have it for your race. Do you need something else?";
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						}
					});
				}
			}
			break;


		case 'process-order':
			{
				console.log("In process-order");
				if (isDefined(actionName)) {
					sfcc.addPaymentService(token, basketId, customerName, orderTotal, (error, result) => {
						if (error) {
							console.log(error);
						} else {
							console.log(result.responseCode);
							text = "Can I use your saved card or Google pay ?";
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
						}
					});
				}
			}
			break;


		case 'orderConfirmed':
			{
				console.log("In orderConfirmed");
				if (isDefined(actionName)) {
					function myFunc(token, payment_id, order_no) {
						//console.log(`In updating payment method ${token} ${payment_id} ${order_no}`);
						sfcc.updatePaymentService(token, order_no, payment_id, orderTotal, (error, result) => {
							if (error) {
								console.log(error);
							} else {
								console.log(result);
							}
						});
					};
					sfcc.placeOrderService(token, basketId, (error, result) => {
						if (error) {
							console.log(error);
						} else {
							payment_id = result.payment_id;
							orderCode = result.code;
							//console.log(result.code+"  "+result.payment_id);
							text = "Your order has been confirmed. They will be delivered to your home address before Saturday. Your store manager will wait for you on Friday to pick up your shoes.";
							messageData = {
								speech: text,
								displayText: text
							}
							res.send(messageData);
							setTimeout(() => myFunc(token, result.payment_id, result.code), 3000);
						}
					});
				}
			}
			break;

		default:
			//unhandled action, just send back the text
			break;
	}
});


function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}

// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
