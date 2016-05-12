var projectStore = require("../ProjectStore.Model")
var config = require("../../../config")

module.exports.routes = [ {
    method: 'GET',
    path: '/',
    config: {
        handler: function(request, reply) {
            projectStore.getAllProjects(function(err, docs) {
                reply.view("index.html", {
                    projects: docs,
                    ga_code: config.ga_code
                });
            });
        }
    }
}]