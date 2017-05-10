/*jshint quotmark:false */
/*jshint white:false */
/*jshint trailing:false */
/*jshint newcap:false */
var app = app || {};

(function () {
	'use strict';

	var Utils = app.Utils;
	// Generic "model" object. You can use whatever
	// framework you want. For this application it
	// may not even be worth separating this logic
	// out, but we do this to demonstrate one way to
	// separate out parts of your application.
	app.TodoModel = function (key) {
		this.key = key;
		this.todos = [];
		this.onChanges = [];
		this.client = app.createTodoClient();
		var archive = Utils.store(key);
		if (archive !== null) {
			this.client.restore(archive);
			this.updateFromProjection();
		}
		this.refresh(500);
	};

	app.TodoModel.prototype.subscribe = function (onChange) {
		this.onChanges.push(onChange);
	};

	app.TodoModel.prototype.refresh = function (interval) {
		this.client.sync('/sync', (function (updated) {
			if (updated) {
				console.log('updated from server');
				this.updateFromProjection();
				this.inform();
			}
		}).bind(this));
		setTimeout((function() { this.refresh(interval); }).bind(this), interval);
	}

	app.TodoModel.prototype.updateFromProjection = function () {
		var todos = [];
		for (var todoId in this.client.projection) {
			var todo = this.client.projection[todoId];
			if (todo.deleted) {
				continue;
			}
			todos.push({'id': todoId, 'title': todo.title, 'completed': todo.checked, 'created': todo.created});
		}
		todos.sort(function(a,b) { return b.created - a.created; });
		this.todos = todos
	}

	app.TodoModel.prototype.inform = function () {
		Utils.store(this.key, this.client.archive());
		this.onChanges.forEach(function (cb) { cb(); });
	};

	app.TodoModel.prototype.addTodo = function (title) {
		var todoId = Utils.uuid();
		this.client.handleCommand({'type': 'insert', 'todoId': todoId, 'title': title});
		this.updateFromProjection();
		this.inform();
	};

	app.TodoModel.prototype.toggleAll = function (checked) {
		for (var todoId in this.client.projection) {
			this.client.handleCommand({'type': 'toggle', 'todoId': todoId});
		}
		this.updateFromProjection();
		this.inform();
	};

	app.TodoModel.prototype.toggle = function (todoToToggle) {
		this.client.handleCommand({'type': 'toggle', 'todoId': todoToToggle.id});
		this.updateFromProjection();
		this.inform();
	};

	app.TodoModel.prototype.destroy = function (todo) {
		this.client.handleCommand({'type': 'delete', 'todoId': todo.id});
		this.updateFromProjection();
		this.inform();
	};

	app.TodoModel.prototype.save = function (todoToSave, text) {
		this.client.handleCommand({'type': 'rename', 'todoId': todoToSave.id, 'title': text});
		this.updateFromProjection();
		this.inform();
	};

	app.TodoModel.prototype.clearCompleted = function () {
		for (var todoId in this.client.projection) {
			if (this.client.projection[todoId].checked) {
				this.client.handleCommand({'type': 'delete', 'todoId': todoId});
			}
		}
		this.updateFromProjection();
		this.inform();
	};

})();
