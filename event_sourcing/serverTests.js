'use strict';

var sync = require('./server');
var fs = require('fs');

function responseEqual(a, b) {
	return a.newSyncedIndex == b.newSyncedIndex && a.newEvents.join(',') === b.newEvents.join(',');
}

function cleanup(path) {
	if (fs.existsSync(path)) {
		fs.unlinkSync(path);
	}
}

function test() {
	var path = __dirname + '/serverTests.txt';
	cleanup(path);
	// Insert some events from client A.
	console.assert(responseEqual(sync(-1, [1, 2, 3], path), {'newSyncedIndex': 2, 'newEvents': []}));
	// Insert some events from client B should return existing events.
	console.assert(responseEqual(sync(-1, [4, 5, 6], path), {'newSyncedIndex': 5, 'newEvents': [1, 2, 3]}));
	// Sync from empty should return all events.
	console.assert(responseEqual(sync(-1, [], path), {'newSyncedIndex': 5, 'newEvents': [1, 2, 3, 4, 5, 6]}));
	// Sync from synced state should return no events.
	console.assert(responseEqual(sync(5, [], path), {'newSyncedIndex': 5, 'newEvents': []}));
	// Sync from missing last event and adding two more events.
	console.assert(responseEqual(sync(4, [7, 8], path), {'newSyncedIndex': 7, 'newEvents': [6]}));
	cleanup(path);
}

test();
