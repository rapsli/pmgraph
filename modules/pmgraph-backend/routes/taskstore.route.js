var taskStore = require("../TaskStore.Model")

module.exports.routes = [{
    method: 'POST',
    path: '/taskstore/{id}',
    config: {
        handler: function(request, reply) {
            taskStore.saveTasksForProject(request.params.id, JSON.parse(request.payload), (err, data) => {
                
                reply("added");    
            });
            
        },
        payload: {
            'parse': false
        }
    }
}, {
    method: 'GET',
    path: '/taskstore/{id}',
    config: {
        handler: function(request, reply) {
            console.log("get store")
            taskStore.getTasksForProject(request.params.id, (err, data) => {
                if (err) {
                    reply(err)
                }
                else if (data == undefined) {
                    reply([])
                }
                else {
                    reply(data);
                }
            });
        }
    }
}]