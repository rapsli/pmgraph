var projectStore = require("../ProjectStore.Model")

module.exports.routes = [ {
    method: 'GET',
    path: '/',
    config: {
        handler: function(request, reply) {
            projectStore.getAllProjects(function(err, docs) {
                reply.view("index.html", {
                    projects: docs
                });
            });
        }
    }
}]