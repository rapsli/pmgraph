var projectStore = require("../ProjectStore.Model")
var config = require("../../../config")

module.exports.routes = [{
    method: 'GET',
    path: '/projects/{id}',
    config: {
        handler: function(request, reply) {
            var projects = projectStore.getProject(request.params.id, function(err, doc) {
                if (doc != null) {
                    reply.view("project.html", {
                        _id: doc._id,
                        ga_code: config.ga_code
                    });
                }
                else {
                    reply.view("project.html");
                }
            });
        }
    }
}]