var ProjectStore = function() {
    //https://github.com/louischatriot/nedb#speed
    var Datastore = require('nedb')
    var db = new Datastore({ filename: './projects.db', autoload: true });
    db.persistence.setAutocompactionInterval(60)
  
    this.setup = function () {
    	var doc = {projectname: "Test Project", 
                    tasks:[{
                        id: 1, 
                        label: 'Node 2', 
                        duration: "1w"
                    }]
            };
        db.insert(doc,function (err, newDoc) {
             console.log(err);
             console.log(newDoc);
        });
    }
    
    this.listAllModules = function(callback) {
    	
    }

    this.getProject = function (projectId, callback) {
         var project = db.findOne({_id: projectId}, function (err, doc) {
              callback(err, doc);
         });
    }

    this.getAllProjects = function (callback) {
        var projects = db.find({}, function (err, docs) {
            callback(err, docs);
        })
    }
     
     this.updateProject = function (projectId, object) {
        db.update({_id:projectId}, object, function (err, data) {
            console.log("successfull update", data)
        })
     }

     this.newProject = function(object) {
        object.nodes = [{id:"root",x:0,y:0,taskTitle:"Kick-Off",shape:"box", deadline:{}, duration:0, progress:"not-started"}];
        object.edges = [];
        console.log("new project")
        db.insert(object);
     }

     this.removeProject = function(projectId) {
        db.remove({_id: projectId});
     }
}

ProjectStore.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
ProjectStore.getInstance = function() {
    if (this.instance === null) {
        this.instance = new ProjectStore();
    }
    return this.instance;
}


module.exports = ProjectStore.getInstance();