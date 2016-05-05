class Visualization {

    constructor(width, height, htmlcontainer, projectid) {
        var self = this;

        this.container = document.getElementById(htmlcontainer);
        this.project = new Project(projectid);
        this.nodesAndEdges = {};
        this.activenode = "";

        this.options = {
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
                    var r = prompt("Name of activity?");
                    if (r == "") {
                        r = "New Activity";
                    }
                    data.taskTitle = r;
                    data.duration = 1;
                    data.progress = "not-started";

                    callback(data);
                    self.project.save(self.nodesAndEdges);
                    self.drawNiceBox();

                }
            },
            nodes: {
                shape: 'box',
                physics: false
            },
            physics: true
        };

        // give the project time to load
        var i = setInterval(function() {
            if (self.project.projectIsLoaded) {
                clearInterval(i)
                self._setupNetwork();
                self._setupEventListeners();
                self.drawNiceBox();
            }
        }, 5)



    }

    _setupNetwork() {
        // provide the data in the vis format
        this.nodesAndEdges = {
            nodes: new vis.DataSet(this.project.getNodes()),
            edges: new vis.DataSet(this.project.getEdges())
        };

        // initialize your network!
        this.network = new vis.Network(this.container, this.nodesAndEdges, this.options);
        // Set the coordinate system of Network such that it exactly
        // matches the actual pixels of the HTML canvas on screen
        // this must correspond with the width and height set for
        // the networks container element.
        this.network.moveTo({
            position: {
                x: 0,
                y: 0
            },
            scale: 1,
        })

        this.startFindingAndHighlightingCriticalPath();
        //this.updateProjectGui();
    }

    drawNiceBox() {
        var notStartedColor = "#eee";
        var inProgressColor = "#5bc0de";
        var doneColor = "#5cb85c";
        var warningColor = "#f0ad4e";

        var DOMURL = window.URL || window.webkitURL || window;

        var data = this.project.getNodes();

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
            if (data[i].deadline != undefined && data[i].deadline.inDanger == true && data[i].deadline.date != undefined) {
                deadLineDangerColor = 'red';
            }

            var rectStyle = "fill:" + color + ";stroke-linecap:round;stroke-linejoin:round;stroke-width:1;stroke:" + deadLineDangerColor + ";";
            var dur = '<span style="color:#000;"><strong>D: ' + data[i].duration + 'w</strong></span>';

            if (data[i].duration == 0) {
                rectStyle = "fill:" + color + ";stroke-linecap:round;stroke-linejoin:round;stroke-width:4;stroke:" + deadLineDangerColor + ";";
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

            var img = new Image();
            var svg = new Blob([box], {
                type: 'image/svg+xml;charset=utf-8'
            });
            var url = DOMURL.createObjectURL(svg);
            data[i].image = url;
            data[i].shape = 'image';
        }
        this.nodesAndEdges.nodes.update(data);
    }

    _setupEventListeners() {
        var self = this;
        this.network.on("dragEnd", function(params) {
            self.network.storePositions();
            self.project.save(self.nodesAndEdges);
        });

        this.network.on("click", function(params) {
            if (params.nodes.length == 0) {
                return false;
            }
            var selectedNodeId = params.nodes[0];
            self.prepareModalView(selectedNodeId);
            self.showDetailsModal();
            self.activenode = selectedNodeId;
        });


        /**
         * makes it easier to save it every 30 seconds
         */
        window.setInterval(function() {
            self.project.save(self.nodesAndEdges);
        }, 60000);

        /**
          changes to the title of a task
        */
        $('#node-title').editable({
            type: 'text',
            mode: "inline",
            success: function(response, newValue) {
                $('#node-title').html(newValue);
                self.getNewDataFromModalWindow();
            }
        });

        $('#node-title').on('shown', function(e, editable) {
            editable.input.$input.val($('#node-title').attr('data-title'));
        });

        $('#project-title').editable({
            type: 'text',
            mode: "inline",
            success: function(response, newValue) {
                self.project.setProjectName(newValue);
                self.project.save(self.nodesAndEdges);
            }
        });

        $('#detailsModal .node-input-data').on('change', function(ev) {
            self.getNewDataFromModalWindow();
        });

        $('#deadline').on('focusout', function(e) {
            self.getNewDataFromModalWindow();
        })

        $('#showDetailsModal').on('click', function(e) {
            self.toggleDetailsModal();
        });


        $('#deadline').datetimepicker({
            locale: 'de',
            format: 'DD.MM.YYYY'
        });

        $("#removeDate").on("click", function(e) {
            $('#deadline').val("");
            self.getNewDataFromModalWindow();
            return false;
        });

        $('#add-new-task').on('click', function(e) {
            var newTask = new Task('', self.activenode)
                //$('#tasks').append(newTask.render())
            self.project.getTaskStore().addNewTask(newTask);
        })

        /*$(window).on("beforeunload", function() {
            this.project.save();
        });*/
    }

    updateProjectGui() {
        var completionDate = moment().add(this.project.criticalPath.duration, 'weeks');
        var completionDateFormatted = completionDate.format("DD.MM.YYYY");
        $('#duration-view').html(this.project.criticalPath.duration + ' weeks - ' + completionDateFormatted);

        this.highlightCriticalPath(this.project.criticalPath.path);
    }

    startFindingAndHighlightingCriticalPath() {

        var rootNode = this.findRootNode();
        var allPaths = this.getAllPaths(rootNode);
        this.highlightDeadLinesInDanger(allPaths);
        this.project.criticalPath = this.findCriticalPath(allPaths);
        this.highlightDeadLinesInDanger(allPaths);

        this.updateProjectGui();
    }

    highlightCriticalPath(criticalPath) {
        //reset existing critical path
        var edges = this.nodesAndEdges.edges.get();
        for (var i = 0; i < edges.length; i++) {
            edges[i].shadow = {
                enabled: false
            }
        }

        this.nodesAndEdges.edges.update(edges);

        for (var i = 0; i < criticalPath.length; i++) {
            if (criticalPath[i + 1] != "") {
                var edges = this.nodesAndEdges.edges.get({
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
                    this.nodesAndEdges.edges.update(cpEdge);

                }
            }

        }
    }

    findCriticalPath(allPaths) {
        var longestPath = "";
        var longestPathDuration = 0;
        for (var i = 0; i < allPaths.length; i++) {
            var duration = 0;
            for (var j = 0; j < allPaths[i].length; j++) {
                var nodeId = allPaths[i][j];
                var node = this.nodesAndEdges.nodes.get(nodeId);
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

    findRootNode() {
        var self = this;
        var rootNode = {};
        var BreakExecption = {};

        // http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break
        // Pretty funky, because it's not possible to break a forEach statement we have to use an exception ;)
        // nice workaround
        try {
            this.nodesAndEdges.nodes.forEach(function(node) {
                var receiveNodes = self.nodesAndEdges.edges.get({
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

    getAllPaths(rootNode) {
        var edges = this.nodesAndEdges.edges.get({
            filter: function(edge) {
                return (edge.from == rootNode.id);
            }
        });

        var path = [];
        var allPaths = []; //the collection of all the paths
        path.push(rootNode.id);

        for (var i = 0; i < edges.length; i++) {
            var newRootNode = this.nodesAndEdges.nodes.get(edges[i].to);
            var newPath = this.recursivelyFindCriticalPath(newRootNode, path, allPaths);
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
    recursivelyFindCriticalPath(newRootNode, path, allPaths) {
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
        var edges = this.nodesAndEdges.edges.get({
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
            var newRootNode = this.nodesAndEdges.nodes.get(edges[i].to);
            this.recursivelyFindCriticalPath(newRootNode, newPath, allPaths);
        }

    }

    highlightDeadLinesInDanger(allPaths) {
        //reset existing critical path
        var nodes = this.nodesAndEdges.nodes.get();
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

        this.nodesAndEdges.nodes.update(nodes);

        for (var i = 0; i < allPaths.length; i++) {
            var dur = 0;
            for (var j = 0; j < allPaths[i].length; j++) {
                var today = moment();
                var n = this.nodesAndEdges.nodes.get(allPaths[i][j]);
                if (n.progress != "completed") {
                    dur = parseInt(n.duration) + dur;
                    var projectedDate = today.add(dur, 'w');
                    if (n.deadline != undefined) {
                        if (projectedDate > moment(n.deadline.date)) {
                            n.deadline.inDanger = true;
                            //console.log("node is in danger", n);
                            this.nodesAndEdges.nodes.update(n);
                        }
                    }

                }


            }
        }
    }

    prepareModalView(selectedNodeId) {
        var selectedNode = this.nodesAndEdges.nodes.get(selectedNodeId);
        $('#detailsModal #node-title').html(selectedNode.taskTitle);
        $('#detailsModal #project-title').html(this.project.getProjectName());
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

        this.project.getTaskStore().render(selectedNodeId);
        //$('#tasks').empty();
        //$('#tasks').append(taskStore.render(selectedNodeId));
        //taskStore.bindInlineEditing();

    }

    getNewDataFromModalWindow() {
        //save the task title
        var nodeid = $('#detailsModal #node-title').attr('data-nodeid');
        var node = this.nodesAndEdges.nodes.get(nodeid)
        node.taskTitle = $('#node-title').html();

        //save the project title


        var progress = $('#task-progress input:radio:checked').val();
        node.progress = progress;

        switch (progress) {
            case "in-progress":
                node.color = this.inProgressColor;
                break;
            case "completed":
                node.color = this.doneColor;
                break;
            case "problem":
                node.color = this.warningColor;
                break;
            default:
                node.color = this.notStartedColor;
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

        this.nodesAndEdges.nodes.update(node)
        this.startFindingAndHighlightingCriticalPath();
        this.project.save(this.nodesAndEdges);

        this.drawNiceBox(node);

    }

    showDetailsModal() {
        $('.cd-panel').addClass('is-visible');
        $('#showDetailsModal i').removeClass('glyphicon-eye-open');
        $('#showDetailsModal i').addClass('glyphicon-eye-close');

    }

    toggleDetailsModal() {
        if ($('.cd-panel').hasClass('is-visible')) {
            $('.cd-panel').removeClass('is-visible')
            $('#showDetailsModal i').addClass('glyphicon-eye-open');
            $('#showDetailsModal i').removeClass('glyphicon-eye-close');
        }
        else {
            this.showDetailsModal();
        }
    }


}