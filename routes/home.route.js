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
}]