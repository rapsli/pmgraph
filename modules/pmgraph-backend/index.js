var routes = require('./routes');



exports.register = function(server, options, next) {

    server.route(routes.routes);
    return next();
};

exports.register.attributes = {
    name: "pmgraph-backend"
};