var path = require("path"), timers = require("timers"), exec = require("child_process").exec, redis = require("redis"), jsdom = require("jsdom"), request = require("request"), admzip = require("adm-zip"), fs = require("fs");
var redisClient = redis.createClient();

var maxDownloads = 1;

Manager = {
    start:function (fontpath) {
        //Store the webroot for exporting the font
        this.fontpath = fontpath;

        this.buildscript = path.join(path.dirname(module.filename), "buildfont.py");
        this.cachedir = path.join(path.dirname(module.filename), "cache");
        if (!fs.existsSync(this.cachedir)) fs.mkdirSync(this.cachedir);

        //Copy font file into cache if it exists
        if(fs.existsSync(fontpath)){
            exec("cp " + fontpath + " " + path.join(this.cachedir, "glyphs.ttf"), function(err, stdout, stderr){
                if(err){
                    console.log("Error copying file font file");
                    console.log(stderr);
                    throw new Error();
                }
            });
        }

        timers.setInterval(function () {
            process.nextTick(Manager.tick);
        }, 5000);
    },

    tick:function () {
//        console.log(Manager.fontpath);     
        //Download if not already exceeding download queue limit
        redisClient.scard("glyph:downloading", function (err, count) {
            if (err) {
                console.log("Error getting downloading count");
                return;
            }
            if (count >= maxDownloads) return;
            redisClient.smembers("glyph:downloads", function (err, downloads) {
                if (err) {
                    console.log("Error getting downloads", err);
                    return;
                }
                if (!downloads || downloads.length == 0) return;
                var key = downloads[0];
                redisClient.smove("glyph:downloads", "glyph:downloading", key);
                Manager.downloadGlyph(key, function (err) {
                    console.log("Error in download glyph " + key, err);
                    //Move back into download queue
                    redisClient.smove("glyph:downloading", "glyph:downloads", key);
                });
                console.log("Starting download of " + key);
            });
        });

        //Add to font anything in the add set
        redisClient.smembers("glyph:add", function (err, glyphs) {
            if (err) {
                console.log("Error getting glyphs to add", err);
                return;
            }
            if (!glyphs || glyphs.length == 0) return;
            var pythonCmd = "python " + Manager.buildscript + " add " + glyphs.map(function(a){return a.split(":")[1];}).join(" ");
            console.log(pythonCmd);
            exec(pythonCmd, {cwd : Manager.cachedir}, function(err, stdout, stderr){
                if(err){
                    console.log("Error adding glyphs");
                    console.log(stderr);
                    return;
                }
                var i = glyphs.length;
                while(i--){
                    redisClient.smove("glyph:add", "glyph:available", glyphs[i]);    
                }
                
                
                //Copy font back to web directory
                exec("cp " + path.join(Manager.cachedir, "glyphs.ttf") + " " + Manager.fontpath, function(err, stdout, stderr){
                    if(err){
                        console.log("Error copying file font file");
                        console.log(stderr);
                        throw new Error();
                    }
                });

            });
        });
    },

    downloadGlyph:function (key, callback) {
        try {
            var id = key.split(":")[1];
            //TODO:Download and parse attribution information
            /*jsdom.env({

             });*/

            //Download zip file
            request({uri:"http://thenounproject.com/download/zipped/svg_" + id + ".zip", encoding:null}, function (err, res, body) {
                if (err) {
                    console.log("Error fetching zip", err);
                    return callback(new Error());
                }
                if (res.statusCode != 200) {
                    console.log("Server responded with non 200 code");
                    console.log(body);
                    return callback(new Error());
                }


//                console.log("Downloaded body", body);
                var zip = new admzip(body);
                var zipFiles = zip.getEntries();
                if (zipFiles.length < 1) {
                    console.log("No files in zip");
                    return callback(new Error());
                }

                fs.writeFile(path.join(Manager.cachedir, id + ".svg"), zip.readFile(zipFiles[0].entryName), function (err) {
                    if (err) {
                        console.log("Error saving file", err);
                        return callback(new Error());
                    }

//                zip.extractEntryTo(zipFiles[0].entryName, path.join(Manager.cachedir, id + ".svg"), false, true);

                    //File is ready to be added to the font
                    redisClient.smove("glyph:downloading", "glyph:add", "glyph:" + id);
                });
            });
        } catch (e) {
            return callback(e);
        }
    }
}

module.exports = Manager;