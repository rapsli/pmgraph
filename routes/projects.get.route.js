var projectStore = require("../models/ProjectStore.Model")

module.exports.routes = [{
    method: 'GET',
    path: '/api/v1/getproject/{id}',
    config: {
        handler: function(request, reply) {
            var projects = projectStore.getProject(request.params.id, function(err, doc) {
                if (doc != null) {
                    //console.log("fetch one", doc)
                    reply(doc);
                }
                else {
                    reply("error");
                }
            });
        }
    }
}]