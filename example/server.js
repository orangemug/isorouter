require("babel-register")({
  presets: ["react"]
});

var path           = require("path");
var express        = require("express");
var yargs          = require("yargs");
var browserify     = require("browserify");
var methodOverride = require("method-override");
var bodyParser     = require("body-parser");
var exphbs         = require("express-handlebars");
var routes         = require("./routes");


var argv = yargs
  .describe("port", "port to start server on")
  .alias("p", "port")
  .default("p", process.env.PORT || 3000)
  .argv;

var app = express();

// <https://github.com/expressjs/method-override#override-using-a-query-value>
app.use(methodOverride("_method"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({extended: true}));


app.engine("handlebars", exphbs({}));
app.set('views', path.join(__dirname, '/views'));
app.set("view engine", "handlebars");


// Serve the JavaScript SPA to the browser
app.use("/app.js", function (req, res) {
  var b = browserify();
  b.transform("babelify", {presets: ["react"]});
  b.add(path.join(__dirname, "client.js"));
  b.bundle().pipe(res);
});

app.use(routes);

var server = app.listen(argv.port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Started at: <%s:%s>", host, port);
});
