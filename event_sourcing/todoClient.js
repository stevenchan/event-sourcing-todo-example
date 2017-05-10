'use strict';
var app = app || {};

(function() {

var ESClient;
if (typeof require !== 'undefined') {
	ESClient = require('./client');
} else {
	ESClient = app.ESClient;
}
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	module.exports = createClient;
} else {
	app.createTodoClient = createClient;
}

// Todo app sample

function createClient() {
	var commandHandlers = {
		'insert': insertCommandHandler,
		'rename': renameCommandHandler,
		'toggle': toggleCommandHandler,
		'delete': deleteCommandHandler
	};
	var eventHandlers = {
		'inserted': insertedEventHandler,
		'renamed': renamedEventHandler,
		'checked': checkedEventHandler,
		'unchecked': uncheckedEventHandler,
		'deleted': deletedEventHandler
	};
	return new ESClient(commandHandlers, eventHandlers, {})
}

// command handlers

function insertCommandHandler(command, pastEvents) {
	return [{'type': 'inserted', 'todoId': command.todoId, 'title': command.title, 'time': Date.now()}];
}

function renameCommandHandler(command, pastEvents) {
	return [{'type': 'renamed', 'todoId': command.todoId, 'title': command.title, 'time': Date.now()}];
}

function toggleCommandHandler(command, pastEvents) {
	// Query whether the todo is checked or not from past events.
	// We will iterate the pass events one by one in this demo,
	// but we can optimize it if the past events are stored in a database.
	var checked = false;
	for (var i = pastEvents.length-1; i >= 0; i--) {
		var event = pastEvents[i];
		if (event.todoId == command.todoId && (event.type == 'checked' || event.type == 'unchecked')) {
			checked = event.type == 'checked';
			break;
		}
	}
	return [{'type': checked ? 'unchecked' : 'checked', 'todoId': command.todoId, 'time': Date.now()}];
}

function deleteCommandHandler(command, pastEvents) {
	return [{'type': 'deleted', 'todoId': command.todoId, 'time': Date.now()}];
}

// event handlers

function insertedEventHandler(event, projection) {
	projection[event.todoId] = {
		'title': event.title, 'checked': false, 'deleted': false,
		'created': event.time, 'modified': event.time
	};
	return projection;
}

function renamedEventHandler(event, projection) {
	var projection = Object.assign({}, projection);
	var todo = Object.assign({}, projection[event.todoId]);
	if (event.time >= todo.modified) {
		todo.title = event.title;
		todo.modified = event.time;
		projection[event.todoId] = todo;
	}
	return projection;
}

function uncheckedEventHandler(event, projection) {
	var projection = Object.assign({}, projection);
	var todo = Object.assign({}, projection[event.todoId]);
	if (event.time >= todo.modified) {
		todo.checked = false;
		todo.modified = event.time;
		projection[event.todoId] = todo;
	}
	return projection;
}

function checkedEventHandler(event, projection) {
	var projection = Object.assign({}, projection);
	var todo = Object.assign({}, projection[event.todoId]);
	if (event.time >= todo.modified) {
		todo.checked = true;
		todo.modified = event.time;
		projection[event.todoId] = todo;
	}
	return projection;
}

function deletedEventHandler(event, projection) {
	var projection = Object.assign({}, projection);
	var todo = Object.assign({}, projection[event.todoId]);
	if (event.time >= todo.modified) {
		todo.deleted = true;
		todo.modified = event.time;
		projection[event.todoId] = todo;
	}
	return projection;
}

})();
