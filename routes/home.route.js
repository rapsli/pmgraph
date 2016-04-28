var projectStore = require("../models/ProjectStore.Model")

module.exports.routes = [{
    method: 'GET',
    path: '/{param*}',

    config: {
        handler: {
            directory: {
                path: 'public',
                listing: true
            }
        },
        description: 'Serve static files from the public firectory',
        tags: ['api', 'public']
    }
}, {
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