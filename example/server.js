var router = require("./router");
var bootstrap = require("isorouter/bootstrap");

var app = bootstrap(router);

var server = app.listen(3000, function() {
  console.log("Started on <http://localhost:%s>", server.address.port());
});
