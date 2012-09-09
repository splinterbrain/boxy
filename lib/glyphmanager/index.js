var path = require("path"), timers = require("timers"), spawn = require("child_process").spawn, redis = require("redis"), jsdom = require("jsdom");
var redisClient = redis.createClient();

Manager = {
    start : function(fontpath){
        //Store the webroot for exporting the font
        this.fontpath = fontpath;
        timers.setInterval(function () {
            process.nextTick(Manager.tick);
        }, 1000);
        this.buildscript = path.join(path.dirname(module.filename), "buildfont.py");        
    },

    tick : function(){
//        console.log(Manager.fontpath);
    },

    downloadGlpyh : function(id){

    },
    
    buildFont : function(){
        var build = spawn("python", [this.buildscript, "add", "16"]);
        build.stdout.on("data", function(data){
            console.log(data.toString());
        });
        build.stderr.on("data", function(data){
            console.log(data.toString());
        });
        build.on("exit", function(code){
            console.log(code);
        });  
    }
}

module.exports = Manager;