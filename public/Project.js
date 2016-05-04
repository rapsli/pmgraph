class Project {

    /**
     * id - project id
     * vis - the visualization library vis.js in order to
     */
    constructor(id, vis) {
        this._id = id;
        this.projectIsLoaded = false;
        this.projectName;
        this.edges;
        this.nodes;
        this.projectIsLoaded;
        this.criticalPath;

        this.loadProjectData(this._id);


        // a list of all tasks for that project. Structure is:
        // {projectid:"xxxxxx", tasks: [{subprojectid:"adfasdad", title:"title of task", status:"completed"}]}
        // 
        this.taskStore = new TaskStore(this.id, "#tasks");
        this.taskStore.init();
    }

    loadProjectData() {
        var self = this
        $.ajax({
            type: "GET",
            url: '/api/v1/getproject/' + this._id,
            success: function(data) {
                self._id = data._id;
                self.projectName = data.projectName;
                //self.edges = new self.vis.DataSet(data.edges);
                //self.nodes = new self.vis.DataSet(data.nodes);
                self.edges = data.edges;
                self.nodes = data.nodes;
                self.projectIsLoaded = true;
            }
        });
    }

    save(nodesAndEdges) {
    	this.updateNodes(nodesAndEdges.nodes.get());
    	this.updateEdges(nodesAndEdges.edges.get());

        var projectObject = {};

        //network.storePositions();
        projectObject._id = this._id;
        projectObject.projectName = this.projectName;
        projectObject.nodes = this.getNodes();
        projectObject.edges = this.getEdges();
        projectObject.criticalPath = this.criticalPath;

        for (var i = 0; i < projectObject.nodes.length; i++) {
            delete projectObject.nodes[i].image;
            projectObject.nodes[i].shape = 'box';
        }
        $.ajax({
            type: "POST",
            url: '/projects/' + this._id,
            data: JSON.stringify(projectObject),
            dataType: 'json',
            success: function(result) {
                console.log("saved Project successfully");
            }
        });
    }

    findCriticalPath() {
        console.log("... finding longest path. Not yet implemented");
    }

    getId() {
        return this._id;
    }

    getProjectName() {
        return this.projectName;
    }

    getEdges() {
        return this.edges;
    }

    getNodes() {
        return this.nodes;
    }

    updateNodes(nodes) {
        this.nodes = nodes;
    }

    updateEdges(edges) {
        this.edges = edges;
    }

    getTaskStore() {
    	return this.taskStore;
    }

    setProjectName(projectName) {
    	this.projectName = projectName;
    }
}