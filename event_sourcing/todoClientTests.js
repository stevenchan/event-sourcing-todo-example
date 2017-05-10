'use strict';

var createTodoClient = require('./todoClient');

// http://stackoverflow.com/a/8809472/134929
function generateUUID() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function testInsertFromEmpty() {
	var client = createTodoClient();
	var todoId = generateUUID();
	client.handleCommand({'type': 'insert', 'todoId': todoId, 'title': 'Hello world'});
	console.assert(client.events.length == 1);
	console.assert(client.pendingEvents.length == 1);
	console.assert(client.projection[todoId].title == 'Hello world');
	console.assert(!client.projection[todoId].checked);
}

function testToggleTodo() {
	var client = createTodoClient();
	var todoId = generateUUID();
	client.handleCommand({'type': 'insert', 'todoId': todoId, 'title': 'Hello world'});
	client.handleCommand({'type': 'toggle', 'todoId': todoId});
	console.assert(client.projection[todoId].checked);
	client.handleCommand({'type': 'toggle', 'todoId': todoId});
	console.assert(!client.projection[todoId].checked);
	client.handleCommand({'type': 'toggle', 'todoId': todoId});
	console.assert(client.projection[todoId].checked);
}

function testRenameTodo() {
	var client = createTodoClient();
	var todoId = generateUUID();
	client.handleCommand({'type': 'insert', 'todoId': todoId, 'title': 'Hello world'});
	client.handleCommand({'type': 'rename', 'todoId': todoId, 'title': 'Hello HK'});
	console.assert(client.projection[todoId].title == 'Hello HK');
}

function testDeleteTodo() {
	var client = createTodoClient();
	var todoId = generateUUID();
	client.handleCommand({'type': 'insert', 'todoId': todoId, 'title': 'Hello world'});
	client.handleCommand({'type': 'delete', 'todoId': todoId});
	console.assert(client.projection[todoId].deleted == true);
}

console.log("Running unit tests...")
testInsertFromEmpty();
testToggleTodo();
testRenameTodo();
testDeleteTodo();
console.log("Tests passed")
