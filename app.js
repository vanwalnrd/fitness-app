/*jshint esversion: 6 */
'use strict';

const config = require('./config');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

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
