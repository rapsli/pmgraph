var projectStore = require("../models/ProjectStore.Model")

module.exports.routes = [{
    method: 'GET',
    path: '/projects/{id}',
    config: {
        handler: function(request, reply) {
            var projects = projectStore.getProject(request.params.id, function(err, doc) {
                if (doc != null) {
                    reply.view("project.html", {
                        nodes: JSON.stringify(doc.nodes),
                        edges: JSON.stringify(doc.edges),
                        _id: doc._id,
                        projectName: doc.projectName,
                        criticalPath: JSON.stringify(doc.criticalPath)
                    });
                }
                else {
                    reply.view("project.html");
                }
            });
        }
    }
}]