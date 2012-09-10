var path = require("path"), timers = require("timers"), spawn = require("child_process").spawn, redis = require("redis"), jsdom = require("jsdom"), request = require("request"), admzip = require("adm-zip"), fs = require("fs");
var redisClient = redis.createClient();

var maxDownloads = 1;

Manager = {
    start:function (fontpath) {
        //Store the webroot for exporting the font
        this.fontpath = fontpath;
        timers.setInterval(function () {
            process.nextTick(Manager.tick);
        }, 5000);
        this.buildscript = path.join(path.dirname(module.filename), "buildfont.py");
        this.cachedir = path.join(path.dirname(module.filename), "cache");
        if(!fs.existsSync(this.cachedir)) fs.mkdirSync(this.cachedir);
    },

    tick:function () {
//        console.log(Manager.fontpath);        
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
                if (downloads.length == 0) return;
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
    },

    buildFont:function () {
        var build = spawn("python", [this.buildscript, "add", "16"]);
        build.stdout.on("data", function (data) {
            console.log(data.toString());
        });
        build.stderr.on("data", function (data) {
            console.log(data.toString());
        });
        build.on("exit", function (code) {
            console.log(code);
        });
    }
}

module.exports = Manager;