var projectStore = require("../ProjectStore.Model")

module.exports.routes = [{
    method: 'POST',
    path: '/api/v1/newProject',
    config: {
        handler: function(request, reply) {
            projectStore.newProject(request.payload);
            reply("added").code(200);
        }
    }
}]
