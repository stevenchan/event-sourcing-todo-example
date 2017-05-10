
var sync = require('./event_sourcing/server');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var path = __dirname + '/events.txt';

app.use(bodyParser.json());

app.post('/sync', function (req, res) {
	var result = sync(req.body.lastSyncedIndex, req.body.events, path);
	res.send(JSON.stringify(result));
});

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

app.use('/', express.static(__dirname + '/'));

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
