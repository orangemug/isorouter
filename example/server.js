var express        = require("express");
var fs             = require("fs");
var path           = require("path");
var yargs          = require("yargs");
var browserify     = require('browserify');
var methodOverride = require('method-override');
var bodyParser     = require('body-parser');
var exphbs         = require('express-handlebars');
var reactify       = require("reactify");

// NOTE: Must be after the requires because it's quite strict on the AST
require('node-jsx').install();


var argv = yargs
  .describe("port", "port to start server on")
  .alias("p", "port")
  .default("p", 3000)
  .argv;

var app = express();

// <https://github.com/expressjs/method-override#override-using-a-query-value>
app.use(methodOverride('_method'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({extended: true}));


app.engine('handlebars', exphbs({}));
app.set('view engine', 'handlebars');


// HACK: Should be in the module itself
app.use("/app.js", function(req, res) {
  var b = browserify();
  b.transform(reactify);
  b.add(__dirname+'/client.js');
  b.bundle().pipe(res);
});

app.use("/*", function(req, res) {
  res.render("index");
});

var server = app.listen(argv.port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Started at: <%s:%s>", host, port);
});
