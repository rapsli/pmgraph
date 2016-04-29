var projectStore = require("../ProjectStore.Model")

module.exports.routes = [{
    method: 'GET',
    path: '/projects/remove/{id}',
    config: {
        handler: function(request, reply) {
            projectStore.removeProject(request.params.id);
	        reply.redirect("/");
        }
    }
}]