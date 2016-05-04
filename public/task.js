/**
 * Task Store. Every project has a taskstore
   It's the container for all the tasks that belong to a project
 */
var TaskStore = function(id, targetContainer) {
	this.taskList = {};
	this.projectid = id;
	var targetContainer = targetContainer; //be default the tasks are rendered in this container
	var currentNid = ""; //a pointer to the node we are currently looking at
	var self = this;

	this.init = function() {
		$.ajax({
			type: "GET",
			url: '/taskstore/' + this.projectid,
			success: function(result) {
				console.log("Init store: ", result)
				if (result.taskList == undefined) {
					return false;
				}
				$.each(result.taskList, function(key, val) {
					if (key != undefined && val.id != undefined) {
						self.addTask(new Task(val.title, val.nid, val.status, val.id));
					}
				})
			}
		});
		console.log("finish init: ", this)
	}

	this.removeTask = function(id) {
		delete this.taskList[id];
		this.save();
	}

	this.addNewTask = function(task) {
		this.addTask(task);
		this.render()
		this.save();
	}
	
	this.addTask = function(task) {
		this.taskList[task.id] = task;
	}

	this.getTask = function(id) {
		return this.taskList[id];
	}
	
	this.updateTask = function(id, uTask) {
		this.taskList[id] = uTask;
		self.save();
	}

	this.save = function() {
		console.log("save task")
		$.ajax({
			type: "POST",
			url: '/taskstore/' + this.projectid,
			data: JSON.stringify(this._stringify()),
			success: function(data) {
				console.log("saved Tasks:", data);
			}
		});
	}

	this._stringify = function() {
		var o = {
			projectid: this.projectid,
			_id: this.projectid,
			taskList: {}
		}
		for (var key in this.taskList) {
			o.taskList[key] = this.taskList[key].stringify()
		}
		return o;
	}

	this.render = function(selectedNode) {
		console.log("current node: ", selectedNode)
		if (selectedNode == undefined) {
			selectedNode = currentNid;
		}
		else {
			currentNid = selectedNode;
		}
console.log("task liste:", this.taskList)
		$(targetContainer).empty();
		for (var key in this.taskList) {
			if (this.taskList[key].nid == selectedNode) {
				var $str = this.bindInlineEditing(this.taskList[key].render());
				$(targetContainer).append($str)
			}
		}
	}

	this.bindInlineEditing = function(str) {
		var $str = $(str);
		$str.find(".task-title").editable({
			success: function(response, newValue) {
				var taskid = $(this).attr('data-taskid');
				var task = self.getTask(taskid)
				task.title = newValue;
				self.updateTask(taskid, task);
			}
		})
		
		$str.find('.del-task').on('click', function(e){
			var taskid = $(this).attr('data-taskid');
			$(e.target).parent().remove();
			self.removeTask(taskid);
		});
		
		$str.find('.task-status').on('click', function(e){
			var taskid = $(this).attr('data-taskid');
			if (this.checked) {
				$(this).next().addClass("closed")
				self.getTask(taskid).complete();
			}
			else {
				$(this).next().removeClass("closed");
				self.getTask(taskid).open();
			}
			self.save();
		});
		
		return $str
	}

}


/**
	id: this is the id of the task
	title: this is the title of the task
	nid: id of the current node
*/
var Task = function(title, nid, status, id) {
	this.id = new Date().getTime();
	if (id != undefined) {
		this.id = id
	}
	
	this.title = title;
	this.nid = nid;
	
	this.status = "open";
	if (status != undefined) {
		this.status = status;	
	}
	
	var self = this;
	
	this.complete = function() {
		this.status = "close";
	}

	this.open = function() {
		this.status = "open"
	}

	this.delete = function() {
		self.parent.removeTask(self.id)
	}

	this.stringify = function() {
		return {
			id: this.id,
			title: this.title,
			nid: this.nid,
			status: this.status
		}
	}

	this.render = function() {
		var checked = "";
		var cssclass = "";
		if (this.status == "close") {
			checked = "checked='checked'";
			cssclass = "closed";
		}
		var str = '<div class="checkbox task"><label><input type="checkbox" class="task-status" value=""  data-taskid="' + this.id + '" '+checked+'><span class="task-title '+cssclass+'" data-taskid="' + this.id + '">' + this.title + '</span></label> <span class="del-task glyphicon glyphicon-remove" data-taskid="' + this.id + '"> </span></div>';
		return str;
	}
}