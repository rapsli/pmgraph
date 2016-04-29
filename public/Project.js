class Project {

    constructor(id) {

        this.projectIsLoaded = false;
        this.loadProjectData(id);
    }

    loadProjectData(id) {
    	var self = this
        $.ajax({
            type: "GET",
            url: '/api/v1/getproject/' + id,
            success: function(data) {
                self._id = data._id;
                self.projectName = data.projectName;
                self.edges = data.edges;
                self.nodes = data.nodes;
                self.projectIsLoaded = true;
            }
        });
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

}