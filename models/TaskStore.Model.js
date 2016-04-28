var TaskStore = function() {
    //https://github.com/louischatriot/nedb#speed
    var Datastore = require('nedb')
    var db = new Datastore({ filename: './tasks.db', autoload: true });
    db.persistence.setAutocompactionInterval(60)
  
    
    this.listAllModules = function(callback) {
    	
    }

    this.getTasksForProject = function (projectId, callback) {
         db.findOne({_id: projectId}, function (err, doc) {
              callback(err, doc);
         });
    }

     this.saveTasksForProject = function (projectId, object, callback) {
        db.update({_id:projectId}, object, { upsert: true }, function (err, data) {
            callback(err, data)
        })
     }

}

TaskStore.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
TaskStore.getInstance = function() {
    if (this.instance === null) {
        this.instance = new TaskStore();
    }
    return this.instance;
}


module.exports = TaskStore.getInstance();