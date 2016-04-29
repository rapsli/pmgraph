var Hapi = require('hapi');
var Hoek = require("hoek")
var NunjucksHapi = require('nunjucks-hapi');
var env = NunjucksHapi.configure('views');
var routes = require('./routes');

var server = new Hapi.Server({});

global.logger = require('bucker').createLogger({
    app: './thelog.log'
});

server.connection({
    port: process.env.PORT || 3012
});

var plugins = [{
    register: require('hapi-auth-cookie')
}, {
    register: require('vision')
}, {
    register: require('inert')
}, {
    register: require('./modules/pmgraph-backend')
}];

server.register(plugins, function(err) {
    Hoek.assert(!err, "Failed to load a plugin: " + err);

    server.views({
        engines: {
            html: NunjucksHapi
        },
        relativeTo: "./",
        path: 'views'
    });

    server.route(routes.routes);

    server.start(function(err) {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
        logger.info("Server started");
    });
});