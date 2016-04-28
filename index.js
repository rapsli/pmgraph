

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
    }
];

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

/*var express = require('express');
var nunjucks = require("nunjucks");
var bodyParser = require("body-parser");
var projectRouter = require("./routers/Project.Router");

var app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended:true
}));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});


// site routes  
app.use('/', projectRouter);

//app.use('/rechnen', routerBlitzrechnen);


/**
 * This is just the webhook for the deplozment to then trigger the deployment script.
 */
/*
app.post('/deployit', function(req,res) {
	var spawn = require('child_process').spawn;
    var deploy = spawn('sh', [ '/var/www/pm-graph/deploy.sh' ]);

    deploy.stdout.on('data', function (data) {
        console.log(''+data);
    });

    deploy.on('close', function (code) {
        console.log('Child process exited with code ' + code);
    });

    res.json(200, {message: 'Bitbucket Hook received!'});
});
// site server
app.listen(process.env.PORT || 3011, function () {
    console.log('My awesome site listening on port 3011');
});*/