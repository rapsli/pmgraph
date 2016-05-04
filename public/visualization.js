class Visualization {

    constructor(width, height, htmlcontainer, projectid) {
        var self = this;
        this.container = document.getElementById(htmlcontainer);
        console.log("vis", vis)
        this.project = new Project(projectid, vis);
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
                editEdge: false
                    /*,
                                    addNode: function(data, callback) {
                                        delete data.label;
                                        data.taskTitle = "New";
                                        callback(data);
                                    }*/
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
        var data = {
            nodes: this.project.getNodes(),
            edges: this.project.getEdges()
        };

        // initialize your network!
        this.network = new vis.Network(this.container, data, this.options);
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
        
        this.project.startFindingLongestPath();
    }

    drawNiceBox() {
        var notStartedColor = "#eee";
        var inProgressColor = "#5bc0de";
        var doneColor = "#5cb85c";
        var warningColor = "#f0ad4e";

        
        var data = this.project.getNodes();
        console.log("draw the nice boxes", data);
        console.log("data", data)

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
        this.project.updateActivities(data);
    }

    _setupEventListeners() {
        this.network.on("dragEnd", function(params) {
            self.saveProject();
        });

        this.network.on("click", function(params) {
            if (params.nodes.length == 0) {
                return false;
            }
            /*var selectedNodeId = params.nodes[0];
            prepareModalView(selectedNodeId);
            showDetailsModal();
            activenode = selectedNodeId;*/
        });

        /**
         * makes it easier to save it every 30 seconds
         */
        window.setInterval(function() {
            self.project.save();
        }, 60000);



        /*$(window).on("beforeunload", function() {
            this.project.save();
        });*/
    }

}