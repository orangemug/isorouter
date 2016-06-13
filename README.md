# isorouter
Isorouter is a routing layer that works across the server/client and has an express like API.

[![circleci](https://circleci.com/gh/orangemug/isorouter.png?style=shield)][circleci]
[![Dependency Status](https://david-dm.org/orangemug/isorouter.svg)][dm-prod]
[![Dev Dependency Status](https://david-dm.org/orangemug/isorouter/dev-status.svg)][dm-dev]

[circleci]:  https://circleci.com/gh/orangemug/isorouter
[dm-prod]:   https://david-dm.org/orangemug/isorouter
[dm-dev]:    https://david-dm.org/orangemug/isorouter#info=devDependencies

Isorouter uses the [history api]() in the browser and can be mounted as a node http server (as well as being mounted inside express). Because isorouter is designed to work across server / client it drops support for things that only make sense on the server.

Also unlike other express like routing it comes with no middleware enabled by default. For example `res.render` doesn't exist, this is mainly to keep things simplier and smaller on the client.

There are some example middlewares that you can include in the [middlewares](/middlewares) directory


## Install
To install

    npm install orangemug/isorouter --save


## Usage
Initialize a router

    var app = isorouter();

Define some rendering middleware. We are using `html` here which just returns plain html strings and on the client will replace the contents of the html page with `.innerHTML`.

    app.use(require("isorouter/middlewares/html")({
      templates: [
        home:    fs.readFileSync(__dirname+"/views/home.html"),
        profile: fs.readFileSync(__dirname+"/views/profile.html")
      ],
      client: {
        element: "#root"
      }
    }));

Define our routes

    app.get("/", function(req, res) {
      res.render("home");
    });

    // Define some sub-routes.
    router.get("/profile", function() {
      res.render("profile");
    });

Now lets hook up the server

    var server = require("isorouter/bootstrap")(app);
    server.listen(8080);


## API
Work in progress API docs


### Promises
If you return a promise the routing will catch errors and pass them to the error handlers

    app.get("/", function(data) {
      // Errors thrown here
      return db.conn()
        .get(1)
        .then(function(data) {
          res.send(data);
        });
    });

**NOTE:** It won't do anything with the returned result. This is due to us wanting to allow partial rendering and streaming with wouldn't be possible via a returned promise result.


## License
[MIT](LICENSE)
