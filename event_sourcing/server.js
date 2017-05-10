var fs = require('fs');

// Events are stored in a text file where each line is an event in this demo.
// We can store them in a database instead for better performance.

function saveEvents(events, path) {
	var text = '';
	for (var i in events) {
		text += JSON.stringify(events[i]) + '\n';
	}
	fs.appendFileSync(path, text, 'utf8');
}

function loadEvents(fromIndex, path) {
	if (!fs.existsSync(path)) {
		return [];
	}
	var content = fs.readFileSync(path, 'utf8');
	var eventJsons = content.split('\n');
	eventJsons.pop(); // remove last empty line
	var events = [];
	for (var i = fromIndex; i < eventJsons.length; i++) {
		events.push(JSON.parse(eventJsons[i]));
	}
	return events;
}

function sync(clientLastSyncedIndex, clientEvents, path) {
	var clientUnseenEvents = loadEvents(clientLastSyncedIndex + 1, path);
	saveEvents(clientEvents, path);
	var newSyncIndex = clientLastSyncedIndex + clientUnseenEvents.length + clientEvents.length
	return {'newSyncedIndex': newSyncIndex, 'newEvents': clientUnseenEvents};
}

module.exports = sync;
