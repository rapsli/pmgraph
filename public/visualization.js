class Visualization {

    constructor(width, height, htmlcontainer, projectid) {
        var self = this;
        this.container = document.getElementById(htmlcontainer);
        this.project = new Project(projectid);
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
                editEdge: false/*,
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
                self._eventListeners();
            }
        }, 5)
        
    }

    _setupNetwork() {
        // provide the data in the vis format
        var data = {
            nodes: this.project.nodes,
            edges: this.project.edges
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
    }

    _eventListeners() {
        this.network.on("dragEnd", function(params) {
            this.saveProject();
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
    }

    saveProject() {

    }


}