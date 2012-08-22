//require('nodetime').profile({
//    stdout : false
//});

var express = require('express'), cons = require('consolidate'), app = express(), connect = require('connect'), path = require('path'), json = require('JSON'), mongodb = require('mongodb'), gzip = require('connect-gzip'), sprintf = require("sprintf").sprintf;


var webroot = path.join(__dirname, 'public');
var HTTP_PORT, DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME;

app.engine("jade", cons.jade);
app.set("view engine", "jade")
app.locals.pretty = true;
app.set("views", path.join(__dirname, "app/views"));


//app.use(flatiron.plugins.log, {});

//Set connection variables for production or development environments
//Probably want to move these to nsconf or such eventually
if (process.env.NODEJS_ENV == "production") {
    HTTP_PORT = 8080;
    var njMongo = "mongodb://nodejitsu:e0cb083372bc48288dce5d24701dbc69@alex.mongohq.com:10027/nodejitsudb597154629585";
    //Thanks to http://joesul.li/van/blog/nodejitsu-node-mongo-native.html for parsing regex
    var arr = /.*:\/\/(.*):(.*)@(.*):(.*)\/(.*)/.exec(njMongo);
    //exec puts the full matched string into arr[0]
    DB_USER = arr[1];
    DB_PASS = arr[2];
    DB_HOST = arr[3];
    DB_PORT = arr[4];
    DB_NAME = arr[5];
    console.info("Parsed mongo info", arr);
} else {
    HTTP_PORT = 8080;
    DB_HOST = "localhost";
    DB_PORT = "27017";
    //Default mongod port
    DB_NAME = "boxy";
}

var mongoose = require("mongoose"), Schema = mongoose.Schema;
mongoose.connection.on("open", function () {
    console.info("Connected to mongo");
});
mongoose.connect("mongodb://localhost:27017/boxy");


var passport = require('passport');
var bcrypt = require("bcrypt");

var TileSchema = new Schema({
    icon:{ type:String },
    details:{ type:String },
    width:{type:Number},
    height:{type:Number},
    color:{type:String},
    link: {type:String}

});

var UserSchema = new Schema({
    username:{type:String, required:true, unique:true},
    email:{type:String, required:true, unique:true},
    password_hash:{type:String, required:true, unique:true},
    tiles:[TileSchema]
});

UserSchema.virtual("password").set(function (password) {
    this.password_hash = bcrypt.hashSync(password, bcrypt.genSaltSync());
});

UserSchema.method("verifyPassword", function (password, cb) {
    console.lg("Veryifying password");
    bcrypt.compare(password, this.password_hash, cb);
});

UserSchema.static("authenticate", function (username, password, cb) {
    console.log("Authenticating");
    this.findOne({username:username}, function (err, user) {
        if (err) {
            console.error("Error finding one user");
            return cb(err, false);
        }
        if (!user) {
            console.error("No such user found");
            return cb(null, false)
        }
        var validPassword = bcrypt.compareSync(password, user.password_hash);
        console.log("Password is valid", validPassword);
        if (!validPassword) return cb(null, false);
        return cb(null, user);
    });
});

var User = mongoose.model("User", UserSchema);

//Eventually move these to modules

//Passport for authentication

var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({
        usernameField:"username"
    }, function (username, password, done) {
        User.authenticate(username, password, function (err, user) {
            console.log("Authentication returned", user);
            return done(err, user);
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//Evetually we'll want to use templates to generate static versions of html files
//For now we just serve the mockups
app.use(connect.favicon("public/favicon.ico"));
//app.use(connect.static("public"));
app.use(connect.logger('tiny', {stream:{write:function (str) {
    console.info(str);
}}}));
app.use(function (req, res, next) {
    //We create an objParams object to hold parsed params
    req.objParams = req.objParams || {};
    next();
});
app.use(express.cookieParser());
app.use(express.bodyParser());

var MongoStore = require('connect-mongo')(express);
app.use(express.session({store:new MongoStore({db: "boxy"}), secret:"secreterthansecret"}));

app.use(passport.initialize());
app.use(passport.session());
//app.use(function (req, res, next) {
//    console.info(req.user);
//    next();
//});
app.use(gzip.staticGzip(webroot));

// /app.use(express.static("public"));

//Routes
//TODO: Move into routes file(s)

app.get("/", function (req, res, next) {
    res.render("index", {title:"Home", req:req});
});

app.param("username", function (req, res, next, username) {
    User.findOne({username:req.params.username}, function (err, user) {
        if (err) {
            next(err);
        } else if (!user) {
            next(); //This should filter down to the 404 eventually
        } else {
            req.objParams.user = user;
            next();
        }
    });
});


app.post("/join", function (req, res, next) {
    console.log(req.body);
    //Create record

    var user = new User({
        username:req.body.username,
        email:req.body.email,
        password:req.body.password
    });
    user.save(function (err) {
        if (err) {
            if (err.name == "MongoError" && err.code == 11000) {
                //Duplicate key problem
                if (err.err.indexOf("username") > -1) {
                    next({message:"Sorry, that username is already taken"});
                } else {
                    next({message:"Sorry, that email is already taken"});
                }
            } else if (false) {

            } else {
                next(err);
            }

        } else {
            passport.authenticate("local", function (err, user, info) {
                if (err) {
                    console.error("Error authenticating user after creation", err);
                    next({message:"Sorry, the account was created but there was a problem logging you in: " + err.message});
                } else if (!user) {
                    console.error("User created but not returned on login", user);
                    next({message:"Sorry, an unknown error occurred"});
                } else {
                    req.logIn(user, function (err) {
                        if (err) {
                            console.error("Error logging in user after creation", err);
                            next({message:"Sorry, the account was created but there was a problem logging you in."});
                        } else {
                            res.send(200, {redirect:"/" + user.username});
                        }
                    });
                }
            })(req, res, next);
        }
    });

});

//TODO: Redirect to user's page
app.post("/login", function (req, res, next) {
    passport.authenticate("local", function (err, user, info) {
        if (err) {
            console.error("Error authenticating user on login", err);
            next({message:"Sorry, there was a problem logging you in"});
        } else if (!user) {
            console.error("User not returned on login", user);
            next({message:"Sorry, incorrect username or password"});
        } else {
            req.logIn(user, function (err) {
                if (err) {
                    console.error("Error logging in user after authentication", err);
                    next({message:"Sorry, there was a problem logging you in."});
                } else {
                    res.send(200, {redirect:"/" + user.username});
                }
            });
        }
    })(req, res, next);
});

app.get("/logout", function (req, res) {
    console.log(req.body);
    req.logout();
    res.redirect("/");
});

app.get("/tiles", function (req, res, next) {
    res.send(200, JSON.stringify())
});

app.get("/:username", function (req, res, next) {
    if (!req.objParams.user) {
        next();
    } else {
        var isOwner = !!(req.user && req.objParams.user.equals(req.user));
        var jsvars = {};
        jsvars.isOwner = isOwner;
        res.render("users/show", {req:req, title:req.objParams.user.username, user:req.objParams.user, isOwner:isOwner, jsvars:jsvars});
    }
});


//Tiles API
app.get("/:username/tiles", function (req, res) {
    if (!req.objParams.user) {
        next();
    } else {
        res.send(200, JSON.stringify(req.objParams.user.tiles));
    }
});

app.post("/:username/tiles", function (req, res) {
    if (!req.objParams.user) {
        next();
    } else {
        if (!req.user || !req.user.equals(req.objParams.user)) {
            if (req.user) {
                console.log(sprintf("Attempt to post to %s by %s", req.objParams.user._id, req.user._id));
            }
            var error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }
        req.objParams.user.tiles.push(req.body);
        req.objParams.user.save(function (err) {
            if (err) throw err;
            res.set("Content-Type", "application/json");
            res.send(201, JSON.stringify(req.objParams.user.tiles[req.objParams.user.tiles.length - 1]));
        });
    }
});

app.put("/:username/tiles/:id", function (req, res) {
    if (!req.objParams.user) {
        next();
    } else {

        if (!req.user || !req.user.equals(req.objParams.user)) {
            if (req.user) {
                console.log(sprintf("Attempt to post to %s by %s", req.objParams.user._id, req.user._id));
            }
            var error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }
        var tile = req.objParams.user.tiles.id(req.params.id);
        if (!tile) next(); // Proceed to 404
//    console.log(req.body);
        tile.icon = req.body.icon;
        tile.details = req.body.details;
        tile.width = req.body.width;
        tile.height = req.body.height;
        tile.color = req.body.color;
        tile.link = req.body.link;

        req.objParams.user.save(function (err) {
            if (err) throw err;
            res.set("Content-Type", "application/json");
            res.send(200, "[]");
        });
    }
});


app.delete("/:username/tiles/:id", function (req, res) {
    if (!req.objParams.user) {
        next();
    } else {

        if (!req.user || !req.user.equals(req.objParams.user)) {
            if (req.user) {
                console.log(sprintf("Attempt to post to %s by %s", req.objParams.user._id, req.user._id));
            }
            var error = new Error("Forbidden");
            error.status = 403;
            throw error;
        }
        var tile = req.objParams.user.tiles.id(req.params.id);
        if (!tile) next(); // Proceed to 404
//    console.log(req.body);
        
        tile.remove();
        
        req.objParams.user.save(function (err) {
            if (err) throw err;
            res.set("Content-Type", "application/json");
            res.send(200, "[]");
        });
    }
});





//If we get here then we haven't found a match and it's a 404
app.use(function (req, res, next) {
    res.status(404).render("404", {req:req});
});

//If we get here then there's an error and its a 500
app.use(function (err, req, res, next) {
    console.error("Server error", err);
    console.error(err.stack);
    if (err.status == 404) {
        //Fallback to plain 404
        res.send(404, "Not found");
    } else if (err.status) {
        res.send(err.status, err.message);
    } else if (err.message) {
        res.send(500, err.message);
    } else {
        res.send(500, "Server error");
    }


});


app.listen(HTTP_PORT);

////We use socket.io to broadcast alerts to the client
//socketio = require('socket.io').listen(app.server);
////Start socketio listener
//socketio.sockets.on("connection", function (socket) {
//    socket.emit("info", {
//        connection:"established"
//    });
//});