//require('nodetime').profile({
//    stdout : false
//});

var express = require('express'), cons = require('consolidate'), app = express(), connect = require('connect'), path = require('path'), json = require('JSON'), mongodb = require('mongodb'), gzip = require('connect-gzip');


var webroot = path.join(__dirname, 'public');
var HTTP_PORT, DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME;

app.engine("jade", cons.jade);
app.set("view engine", "jade")
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

var UserSchema = new Schema({
    username:{type:String, required:true, unique:true},
    email:{type:String, required:true, unique:true},
    password_hash:{type:String, required:true, unique:true}
});

UserSchema.virtual("password").set(function (password) {
    this.password_hash = bcrypt.hashSync(password, bcrypt.genSaltSync());
});

UserSchema.method("verifyPassword", function(password, cb){
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
app.use(connect.favicon());
//app.use(connect.static("public"));
app.use(connect.logger('tiny', {stream:{write:function (str) {
    console.info(str);
}}}));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret:"secreterthansecret"}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
    console.info(req.user);
    next();
});
app.use(gzip.staticGzip(webroot));

// /app.use(express.static("public"));

//Routes
//TODO: Move into routes file(s)

app.get("/", function(req, res, next){
   res.render("index.jade");
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
        if (err) return null;
        //TODO: Log the user in
        passport.authenticate("local", {successRedirect:"/", failureRedirect:"/"})(req, res, next);
//        res.redirect("/login");
    });

});

//TODO: Redirect to user's page
app.post("/login", passport.authenticate("local", {successRedirect:"/", failureRedirect:"/"}), function (req, res) {
    console.log(req.body);
//    res.redirect("/");
});

app.get("/logout", function (req, res) {
    console.log(req.body);
    req.logout();
    res.redirect("/");
});


//If we get here then we haven't found a match and it's a 404
app.use(function (req, res, next) {
    res.status(404).sendfile("404.html");
});

//If we get here then there's an error and its a 500
app.use(function (err, req, res, next) {
    console.error(err);
    if (err.status == 404) {
        //Fallback to plain 404
        res.send(404, "Not found");
    } else {
        res.send(500, "Server error");
    }

});

/*
 //We name space API so we can have html files of similar name later
 //It doesn't appear that director allows for route matching based on
 //Accept header, so json/html server at same endpoint would have to
 //occur inside the function
 app.router.path("/api/garments/:id", function () {
 this.get(function (id) {
 //Store these for use in db callbacks
 var res = this.res;
 var req = this.req;

 //Mongos double nested callback structure is a bit cumbersome
 //Might want to look into resourceful or mongoose
 //May also be able to store a reference to the collection
 db.collection('garments', function (err, collection) {
 if (err) {
 //Should have a shared 500 error system, maybe with a try/catch, though difficult to attach to the router
 app.log.error("Error retrieving collection", err);
 res.writeHead(500);
 res.end(err);
 } else {
 var _id;
 try {
 _id = mongodb.ObjectID.createFromHexString(id);
 } catch (e) {
 app.log.error("Error creating id", e);
 res.writeHead(500);
 res.end();
 return;
 }

 collection.findOne({
 _id:_id
 }, {
 image:0
 }, function (err, doc) {
 if (err) {
 app.log.error("Error retrieving record", err);
 res.writeHead(500);
 res.end(err);
 } else {
 res.writeHead(200, {
 'Content-Type':'application/json'
 });
 res.write(json.stringify(doc));
 res.end();

 }
 });
 }
 });
 });
 //Making a fairly duplicative put to complement the post below
 //Probably want to unify these into a single upsert call while maintaining the endpoints
 this.put(function (id) {
 //Store these for use in db callbacks
 var res = this.res;
 var req = this.req;

 //Just copy and pasted this whole nested flow, never a good sign, efficiency-wise
 db.collection('garments', function (err, collection) {
 if (err) {
 //Should have a shared 500 error system, maybe with a try/catch, though difficult to attach to the router
 app.log.error("Error retrieving collection", err);
 res.writeHead(500);
 res.end(err);
 } else {
 var update = {};
 //Need some validation here eventually
 //Theoretically req.body is ready and parsed when the function gets called
 if (req.body.item)
 update.item = req.body.item;
 if (req.body.color)
 update.color = req.body.color;
 if (req.body.style)
 update.style = req.body.style;
 //We update the image as base64, which is a bit ugly, but mongo binary is being uncooperative
 //Also have to keep in mind the 4MB size limit
 //Might eventually move to GridFS
 if (req.body.image)
 update.image = req.body.image;

 var _id;
 try {
 _id = mongodb.ObjectID.createFromHexString(id);
 } catch (e) {
 app.log.error("Error creating id", e);
 res.writeHead(500);
 res.end();
 return;
 }

 collection.update({
 _id:_id
 }, update, {
 safe:true
 }, function (err, doc) {
 if (err) {
 app.log.error("Error retrieving record", err);
 res.writeHead(500);
 res.end(err);
 } else {
 if (doc) {
 //We only get a count of updates back
 app.log.info("updated doc", doc);
 res.writeHead(200, {
 'Content-Type':'application/json'
 });
 res.end();
 analyzeGarments();
 } else {
 //Update didn't find a matching id
 app.log.error("Failed to update record ", id);
 res.writeHead(404);
 res.end();
 }
 }
 });
 }
 });
 }),
 //Access the image
 this.get("/image", function (id) {
 //Store these for use in db callbacks
 var res = this.res;
 var req = this.req;

 //Mongos double nested callback structure is a bit cumbersome
 //Might want to look into resourceful or mongoose
 //May also be able to store a reference to the collection
 db.collection('garments', function (err, collection) {
 if (err) {
 //Should have a shared 500 error system, maybe with a try/catch, though difficult to attach to the router
 app.log.error("Error retrieving collection", err);
 res.writeHead(500);
 res.end(err);
 } else {
 var _id;
 try {
 _id = mongodb.ObjectID.createFromHexString(id);
 } catch (e) {
 app.log.error("Error creating id", e);
 res.writeHead(500);
 res.end();
 return;
 }

 collection.findOne({
 _id:_id
 }, function (err, doc) {
 if (err) {
 app.log.error("Error retrieving record", err);
 res.writeHead(500);
 res.end(err);
 } else {
 //Need to write some headers here to allow for caching
 res.writeHead(200, {
 "Content-Type":"image/jpeg"
 });
 //Right now we just write an empty response if there's no image
 //Might want to make it a 404 or such
 if (doc.image)
 res.write(new Buffer(doc.image, "base64"));
 res.end();

 }
 });
 }
 });
 });
 });

 app.router.path("/api/garments", function () {

 //Eventually need to have some filters on this
 //Probably default to only the current session's user's garments
 this.get(function () {
 //Store these for use in db callbacks
 var res = this.res;
 var req = this.req;

 db.collection('garments', function (err, collection) {
 if (err) {
 //Should have a shared 500 error system, maybe with a try/catch, though difficult to attach to the router
 app.log.error("Error retrieving collection", err);
 res.writeHead(500);
 res.end(err);
 } else {
 collection.find({}).toArray(function (err, docs) {
 if (err) {
 app.log.error("Error retrieving index");
 res.writeHead(500);
 res.end(err);
 } else {
 res.writeHead(200, {
 "Content-Type":"application/json"
 });
 res.write(json.stringify(docs));
 res.end();
 }
 });
 }
 });
 });

 this.post(function () {
 //Store these for use in db callbacks
 var res = this.res;
 var req = this.req;

 //Just copy and pasted this whole nested flow, never a good sign, efficiency-wise
 db.collection('garments', function (err, collection) {
 if (err) {
 //Should have a shared 500 error system, maybe with a try/catch, though difficult to attach to the router
 app.log.error("Error retrieving collection", err);
 res.writeHead(500);
 res.end(err);
 } else {
 var insert = {};
 //Need some validation here eventually
 //Theoretically req.body is ready and parsed when the function gets called
 // app.log.info("body", req.body);
 insert.item = req.body.item;
 insert.color = req.body.color;
 insert.style = req.body.style;
 //We save the image as base64, which is a bit ugly, but mongo binary is being uncooperative
 //Also have to keep in mind the 4MB size limit
 //Might eventually move to GridFS
 insert.image = req.body.image;
 collection.insert(insert, function (err, docs) {
 if (err) {
 app.log.error("Error retrieving record", err);
 res.writeHead(500);
 res.end(err);
 } else {
 res.writeHead(201, {
 'Content-Type':'application/json'
 });
 res.write(json.stringify(docs[0]));
 res.end();

 analyzeGarments();

 }
 });
 }
 });
 });
 });

 app.router.configure({
 notfound:function () {
 this.res.writeHead(404);
 this.res.end("404 Not Found");
 }
 });
 */
app.listen(HTTP_PORT);

//We use socket.io to broadcast alerts to the client
socketio = require('socket.io').listen(app.server);
//Start socketio listener
socketio.sockets.on("connection", function (socket) {
    socket.emit("info", {
        connection:"established"
    });
});