'use strict';
var app = app || {};

(function() {

class ESClient {

	constructor(commandHandlers, eventHandlers, initialProjection) {
		this.events = [];
		this.pendingEvents = [];
		this.syncedEventIndex = -1;
		this.syncing = false;
		this.projection = initialProjection;
		this.commandHandlers = commandHandlers;
		this.eventHandlers = eventHandlers;
	}

	handleCommand(command) {
		var commandHandler = this.commandHandlers[command.type];
		var events = commandHandler(command, this.events);
		this._appendNewEvents(events);
		this._updateProjection(events);
		return events
	}

	restore(archive) {
		this.events = archive.events;
		this.pendingEvents = archive.pendingEvents;
		this.syncedEventIndex = archive.syncedEventIndex;
		this._updateProjection(this.events);
	}

	archive() {
		return {'events': this.events, 
		        'pendingEvents': this.pendingEvents,
		        'syncedEventIndex': this.syncedEventIndex};
	}

	_appendNewEvents(events) {
		this.events = this.events.concat(events)
		this.pendingEvents = this.pendingEvents.concat(events);
	}

	_updateProjection(events) {
		for (var i in events) {
			var event = events[i];
			var eventHandler = this.eventHandlers[event.type];
			this.projection = eventHandler(event, this.projection);
		}
	}

	sync(url, callback) {
		if (this.syncing) {
			console.log('syncing already');
			callback(false);
			return;
		}
		this.syncing = true;
		var http = new XMLHttpRequest();
		var eventsToUpload = this.pendingEvents.slice();
		var params = JSON.stringify({'lastSyncedIndex': this.syncedEventIndex, 'events': eventsToUpload});
		http.open('POST', url, true);
		http.setRequestHeader('Content-type', 'application/json');
		http.onreadystatechange = (function() {//Call a function when the state changes.
			this.syncing = false;
		    if (!(http.readyState == 4 && http.status == 200)) {
		        callback(false);
		        return;
		    }
		    var result = JSON.parse(http.responseText);
		    var updated = this.syncedEventIndex != result.newSyncedIndex;
		    this.pendingEvents.splice(0, eventsToUpload.length);
		    this.syncedEventIndex = result.newSyncedIndex;
		    this.events = this.events.concat(result.newEvents);
		    this._updateProjection(result.newEvents);
		    callback(updated);
		}).bind(this);	
		http.send(params);
	}

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = ESClient;
} else {
	app.ESClient = ESClient;
}

})();
