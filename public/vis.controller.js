/**
  colors: 
    not-started: #fff
    in-progress: #5bc0de
    done: #5cb85c
*/

var notStartedColor = "#eee";
var inProgressColor = "#5bc0de";
var doneColor = "#5cb85c";
var warningColor = "#f0ad4e";

//this is our node template
var DOMURL = window.URL || window.webkitURL || window;


// create a network
var container = document.getElementById('mynetwork');

// provide the data in the vis format
var data = {
    nodes: project.nodes,
    edges: project.edges
};

// a list of all tasks for that project. Structure is:
// {projectid:"xxxxxx", tasks: [{subprojectid:"adfasdad", title:"title of task", status:"completed"}]}
// 
var taskStore = new TaskStore(project._id, "#tasks");
taskStore.init();

var activenode = "";

var width = $(document).width();
var height = $(document).height() - 70;

var options = {
    width: width + 'px',
    height: height + 'px',
    clickToUse: false,
    edges: {
        arrows: {
            to: {
                enabled: true
            }
        },
        physics: true,
        smooth: false,
        color: "#666"
    },
    manipulation: {
        enabled: true,
        editEdge: false,
        addNode: function(data, callback) {
            delete data.label;
            data.taskTitle = "New";
            callback(data);
        }
    },
    nodes: {
        shape: 'box',
        physics: false
    },
    physics: true

};

// initialize your network!
var network = new vis.Network(container, data, options);

// Set the coordinate system of Network such that it exactly
// matches the actual pixels of the HTML canvas on screen
// this must correspond with the width and height set for
// the networks container element.
network.moveTo({
    position: {
        x: 0,
        y: 0
    },
    scale: 1,
})



/**
 * somethign in the network has changed... or not, but let's save it
 * @param  {Object} params) {               var projectObject [description]
 * @return {[type]}         [description]
 */
/*network.on("dragEnd", function(params) {
    saveProject();
});

project.nodes.on("add", function(params) {
    saveProject();
});

project.nodes.on("update", function(params) {
    saveProject();
});*/

/**
 * makes it easier to save it every 30 seconds
 */
window.setInterval(function() {
    saveProject();
}, 60000);

network.on("dragEnd", function(params) {
    saveProject();
});

$(window).on("beforeunload", function() {
    saveProject();
});


function saveProject() {
    var projectObject = {};

    network.storePositions();
    projectObject._id = project._id;
    projectObject.projectName = project.projectName;
    projectObject.nodes = project.nodes.get();
    projectObject.edges = project.edges.get();
    projectObject.criticalPath = project.criticalPath;

    for (var i = 0; i < projectObject.nodes.length; i++) {
        delete projectObject.nodes[i].image;
        projectObject.nodes[i].shape = 'box';
    }

    $.ajax({
        type: "POST",
        url: '/projects/' + project._id,
        data: JSON.stringify(projectObject),
        dataType: 'json',
        success: function(result) {
            console.log("saved Project successfully");
        }
    });

    startFindingLongestPath();
}

function getAllPaths(rootNode) {
    var edges = project.edges.get({
        filter: function(edge) {
            return (edge.from == rootNode.id);
        }
    });

    var path = [];
    var allPaths = []; //the collection of all the paths
    path.push(rootNode.id);

    for (var i = 0; i < edges.length; i++) {
        var newRootNode = project.nodes.get(edges[i].to);
        var newPath = recursivelyFindCriticalPath(newRootNode, path, allPaths);
    }

    return allPaths;
}

/**
 * [recursivelyFindCriticalPath description]
 * @param  {[Object]} newRootNode [description]
 * @param  {[array]} path        [description]
 * @param  {[array]} allPaths    this is the array where we collect all possible paths.
 * @return none
 */
function recursivelyFindCriticalPath(newRootNode, path, allPaths) {
    if (path.length > 500) {
        //throw "Endless loop (> 250)";
        console.log("this is probably an endless loop")
        return;
    }

    var newPath = [];
    for (var i = 0; i < path.length; i++) { // we copy the array and don't want to have a reference to path
        newPath.push(path[i]);
    }
    newPath.push(newRootNode.id); //this is the path for the current node

    // get edges that leave this newRootNode
    var edges = project.edges.get({
        filter: function(edge) {
            return (edge.from == newRootNode.id);
        }
    });

    if (edges.length == 0) { //if ther are no edges leaving from this node, then this is a leafe node
        allPaths.push(newPath);
    }

    //console.log("path for node: " + newRootNode.label, newPath);

    // go through all edges and continue our search for paths
    for (var i = 0; i < edges.length; i++) {
        var newRootNode = project.nodes.get(edges[i].to);
        recursivelyFindCriticalPath(newRootNode, newPath, allPaths);
    }

}

function findRootNode() {
    var rootNode = {};
    var BreakExecption = {};

    // http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
    // Pretty funky, because it's not possible to break a forEach statement we have to use an exception ;)
    // nice workaround
    try {
        project.nodes.forEach(function(node) {
            var receiveNodes = project.edges.get({
                filter: function(edge) {
                    return (edge.to == node.id);
                }
            });
            if (receiveNodes.length == 0) {
                rootNode = node;
                throw BreakExecption;
            }
        });
    }
    catch (e) {
        if (e !== BreakExecption) {
            throw e;
        }
    }

    return rootNode;
}

function findLongestPath(allPaths) {
    var longestPath = "";
    var longestPathDuration = 0;
    for (var i = 0; i < allPaths.length; i++) {
        var duration = 0;
        for (var j = 0; j < allPaths[i].length; j++) {
            var nodeId = allPaths[i][j];
            var node = project.nodes.get(nodeId);
            if (node.progress != "completed") {
                duration = parseInt(duration) + parseInt(node.duration);
            }

        }

        if (duration > longestPathDuration) {
            longestPathDuration = duration;
            longestPath = allPaths[i];
        }
    }
    return {
        duration: longestPathDuration,
        path: longestPath
    }
}

function highlightCriticalPath(criticalPath) {

    //reset existing critical path
    var edges = project.edges.get();
    for (var i = 0; i < edges.length; i++) {
        edges[i].shadow = {
            enabled: false
        }
    }

    project.edges.update(edges);

    for (var i = 0; i < criticalPath.length; i++) {
        if (criticalPath[i + 1] != "") {
            var edges = project.edges.get({
                filter: function(edge) {
                    return (edge.from == criticalPath[i] && edge.to == criticalPath[i + 1]);
                }
            });
            if (edges.length > 0) {
                var cpEdge = edges[0];
                cpEdge.shadow = {
                    color: 'red',
                    size: 10,
                    enabled: true
                }
                project.edges.update(cpEdge);

            }
        }

    }
}

function highlightDeadLinesInDanger(allPaths) {
    //reset existing critical path
    var nodes = project.nodes.get();
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].deadline == undefined) {
            nodes[i].deadline = {
                inDanger: false
            }
        }
        else {
            nodes[i].deadline.inDanger = false;
        }
    }

    project.nodes.update(nodes);

    for (var i = 0; i < allPaths.length; i++) {
        var dur = 0;
        for (var j = 0; j < allPaths[i].length; j++) {
            var today = moment();
            var n = project.nodes.get(allPaths[i][j]);
            if (n.progress != "completed") {
                dur = parseInt(n.duration) + dur;
                var projectedDate = today.add(dur, 'w');
                if (n.deadline != undefined) {
                    if (projectedDate > moment(n.deadline.date)) {
                        n.deadline.inDanger = true;
                        //console.log("node is in danger", n);
                        project.nodes.update(n);
                    }
                }

            }


        }
    }
}

function startFindingLongestPath() {

    var rootNode = findRootNode();
    var allPaths = getAllPaths(rootNode);
    highlightDeadLinesInDanger(allPaths);
    project.criticalPath = findLongestPath(allPaths);

    updateProjectGui();
}



function updateProjectGui() {
    var completionDate = moment().add(project.criticalPath.duration, 'weeks');
    var completionDateFormatted = completionDate.format("DD.MM.YYYY");
    $('#duration-view').html(project.criticalPath.duration + ' weeks - ' + completionDateFormatted);

    highlightCriticalPath(project.criticalPath.path);
}

function loadProject() {
    $.ajax({
        type: "GET",
        url: '/api/v1/getproject/' + project._id,
        success: function(data, err) {
            drawNiceBox(data.nodes);
        }
    });
}

function drawNiceBox(data) {
    console.log("draw the nice boxes");
    if (!Array.isArray(data)) {
        data = [data]
    }

    for (var i = 0; i < data.length; i++) {
        var color = '#eee';
        switch (data[i].progress) {
            case "in-progress":
                color = inProgressColor;
                break;
            case "completed":
                color = doneColor;
                break;
            case "problem":
                color = warningColor;
                break;
            default:
                color = notStartedColor;
        }

        var deadLineDangerColor = "black";
        if (data[i].deadline != undefined && data[i].deadline.inDanger == "true" && data[i].deadline.date != undefined) {
            deadLineDangerColor = 'red';
        }


        var rectStyle = "fill:" + color + ";stroke-linecap:round;stroke-linejoin:round;stroke-width:1;stroke:#000;";
        var dur = '<span style="color:#000;"><strong>D: ' + data[i].duration + 'w</strong></span>';
        if (data[i].duration == 0 || deadLineDangerColor == 'red') {
            rectStyle = "fill:" + color + ";stroke-width:4;stroke:" + deadLineDangerColor + ";";
            //dur = "";
        }

        if (data[i].duration == 0) {
            dur = "";
        }

        var deadline = "";
        if (data[i].deadline != undefined && data[i].deadline.date != undefined && data[i].deadline.date != "") {
            deadline = moment(data[i].deadline.date).format("DD.MM.YY");
            if (dur != "") {
                deadline = " - " + deadline;
            }
        }

        var box = '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="70">' +
            '<rect x="3" y="3" rx="10" ry="10" width="140" height="60" style="' + rectStyle + '"></rect>' +
            '<foreignObject x="5" y="5" width="100%" height="100%">' +
            '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:12px;font-family:verdana;">' +
            '<span style="color:#000;padding-left:5px;padding-top:10px;">' + data[i].taskTitle + '</span><br/>' +
            '<span style="padding-left:5px;">' + dur + deadline + '</span>' +
            '</div>' +
            '</foreignObject>' +
            '</svg>'

            console.log(box);
        var img = new Image();
        var svg = new Blob([box], {
            type: 'image/svg+xml;charset=utf-8'
        });
        var url = DOMURL.createObjectURL(svg);
        data[i].image = url;
        data[i].shape = 'image';
    }
    project.nodes.update(data);
}

/**
 * prepare the details modal windows for displaying taks details
 */
function prepareModalView(selectedNodeId) {
    var selectedNode = project.nodes.get(selectedNodeId);
    $('#detailsModal #node-title').html(selectedNode.taskTitle);
    $('#detailsModal #project-title').html(project.projectName);
    $('#detailsModal #node-title').attr('data-nodeid', selectedNodeId);
    $('#detailsModal #node-title').attr('data-title', selectedNode.taskTitle);

    if (selectedNode.progress == null) {
        $('#task-progress input:radio').prop("checked", false);
    }
    else {
        $('#task-progress input:radio[value="' + selectedNode.progress + '"]').prop("checked", true);
    }

    //console.log("inspect clicked node", selectedNode);

    if ((selectedNode.deadline != undefined) && (selectedNode.deadline.date != undefined) && (selectedNode.deadline.date != "Invalid date")) {
        $('#deadline').val(moment(selectedNode.deadline.date).format("DD.MM.YYYY"));
    }
    else {
        $('#deadline').val("");
    }

    $('#duration').val(0);
    if (selectedNode.duration != null && selectedNode.duration != "") {
        $('#duration').val(selectedNode.duration);
    }

    if ($('#node-title').attr('data-title') == "") {
        $('#node-title').addClass('editable-empty');
    }
    else {
        $('#node-title').removeClass('editable-empty');
    }
    
    taskStore.render(selectedNodeId);
    //$('#tasks').empty();
    //$('#tasks').append(taskStore.render(selectedNodeId));
    //taskStore.bindInlineEditing();

}

$(document).ready(function() {
    loadProject();
    startFindingLongestPath();
    /**
    closing the modal. We have to make sure that we take all the changes
    and store them persistantly
  */
    function getNewDataFromModalWindow() {
        //save the task title
        var nodeid = $('#detailsModal #node-title').attr('data-nodeid');
        var node = project.nodes.get(nodeid)
        node.taskTitle = $('#node-title').html();

        //save the project title


        var progress = $('#task-progress input:radio:checked').val();
        node.progress = progress;

        switch (progress) {
            case "in-progress":
                node.color = inProgressColor;
                break;
            case "completed":
                node.color = doneColor;
                break;
            case "problem":
                node.color = warningColor;
                break;
            default:
                node.color = notStartedColor;
        }

        var deadline = $('#deadline').val();
        node.deadline = {};
        if (deadline != "") {
            var date = moment(deadline, "DD.MM.YYYY");
            node.deadline = {
                date: date.toISOString()
            };
        }

        var duration = $('#duration').val();
        node.duration = duration;

        drawNiceBox(node);
        saveProject();
    }


    /**
          changes to the title of a task
        */
    $('#node-title').editable({
        type: 'text',
        mode: "inline",
        success: function(response, newValue) {
            $('#node-title').html(newValue);
            getNewDataFromModalWindow();
        }
    });

    $('#node-title').on('shown', function(e, editable) {
        editable.input.$input.val($('#node-title').attr('data-title'));
    });

    /**
    changes to the title of a project
  */
    $('#project-title').editable({
        type: 'text',
        mode: "inline",
        success: function(response, newValue) {
            project.projectName = newValue;
            saveProject();
        }
    });

    $('#detailsModal .node-input-data').on('change', function(ev) {
        getNewDataFromModalWindow();
    });

    $('#deadline').on('focusout', function(e) {
        getNewDataFromModalWindow();
    })

    /**
    a double click. 
      TODO: we still have to ensure that only nodes are "double clickable". Currently you can also click edges
    */
    network.on("click", function(params) {
        if (params.nodes.length == 0) {
            return false;
        }
        var selectedNodeId = params.nodes[0];
        prepareModalView(selectedNodeId);
        showDetailsModal();
        activenode = selectedNodeId;
    });

    $('#showDetailsModal').on('click', function(e) {
        toggleDetailsModal();
    });


    $('#deadline').datetimepicker({
        locale: 'de',
        format: 'DD.MM.YYYY'
    });

    $("#removeDate").on("click", function(e) {
        $('#deadline').val("");
        getNewDataFromModalWindow();
        return false;
    });

    $('#add-new-task').on('click', function(e) {
        var newTask = new Task('', activenode)
        //$('#tasks').append(newTask.render())

        taskStore.addNewTask(newTask);
    })

});



function showDetailsModal() {
    $('.cd-panel').addClass('is-visible');
    $('#showDetailsModal i').removeClass('glyphicon-eye-open');
    $('#showDetailsModal i').addClass('glyphicon-eye-close');

}

function toggleDetailsModal() {
    if ($('.cd-panel').hasClass('is-visible')) {
        $('.cd-panel').removeClass('is-visible')
        $('#showDetailsModal i').addClass('glyphicon-eye-open');
        $('#showDetailsModal i').removeClass('glyphicon-eye-close');
    }
    else {
        showDetailsModal();
    }
}
