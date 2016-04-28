var projectStore = require("../models/ProjectStore.Model")

module.exports.routes = [{
    method: 'POST',
    path: '/projects/{id}',
    config: {
        handler: function(request, reply) {
            projectStore.updateProject(request.params.id, JSON.parse(request.payload));
            reply("added");
        },
        payload: {
            'parse': false
        }
    }
}]