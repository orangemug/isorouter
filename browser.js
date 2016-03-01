var Url          = require("url");
var pathToRegexp = require("path-to-regexp");
var browserEnv   = require("./lib/dom_event_handler");
var historyEnv   = require("./lib/history");
var urlParser    = require("./lib/url_parser");

/**
 * handler - create a route handler
 * @param {String}    method        http method (GET, POST, PUT, DELETE)
 * @param {String}    path          path to navigate to
 * @param {Function}  fn            middleware function
 * @param {Function}  next          call the next item in the middleware stack
 * @returns {undefined}
 */
function addRouteHandler (method, path, fn) {

  // If using router.use(middleware) then set a catch all path
  if (!fn) {
    fn = path;
    path = "/*";
  }

  var re = pathToRegexp(path);
  var keys = re.keys;

  /**
   * Construct a routeHandler
   * @param {String} _method     HTTP method of the incoming request
   * @param {String} _path       url path of the incoming request
   * @returns {false|Function} express like middleware
   */
  function routeHandler (_method, _path) {
    // Check the method matches
    if (method !== "use" && method !== _method) {
      return false;
    }

    // Check the path matches
    var pathname = Url.parse(_path).pathname;
    var results = re.exec(pathname);
    if (!results) {
      return false;
    }

    /**
     * Wrap a route handler
     * @param {Error} [err]        optional error denoting should pass request to error handling middleware
     * @param {Object} req         request object
     * @param {Object} res         response object
     * @param {Function} next      continuation function called with an optional error param
     * @returns {Void} next will be called
     */
    return function handler () {
      var err, req, res, next;
      if (arguments.length === 4) {
        err = arguments[0];
        req = arguments[1];
        res = arguments[2];
        next = arguments[3];
      } else {
        req = arguments[0];
        res = arguments[1];
        next = arguments[2];
      }

      var params = {};
      keys.forEach(function (key, idx) {
        params[key.name] = results[idx+1];
      });
      req.params = params;

      if (err) {
        // Bypass any handlers which don't accept the express error argument signature
        if (fn.length < 4) {
          next(err);
        } else {
          fn(err, req, res, next);
        }
      } else {
        if (fn.length < 4) {
          fn(req, res, next);
        } else {
          next();
        }
      }
    };
  }

  this.routes.push(routeHandler);
}

/**
 * go - peform a request to router
 * @param {String}    path          path to navigate to
 * @param {Object}    opts          navigation options
 * @param {String}    opts.method   http method (GET, POST, PUT, DELETE)
 * @param {Boolean}   opts.replace  replace the last item in pushstate history
 * @param {Boolean}   opts.silent   if silent the router handler isn't triggered
 * @param {Object}    opts.body     request body to send
 * @param {Object}    opts.locals   extra data such as a flash message
 * @returns {Boolean} if the request was sent
 */
function go (path, opts) {
  var self = this;

  // If not navigating anywhere return
  if (!path || path === "") {
    return false;
  }

  opts = opts || {};

  var method = opts.method || "get";

  var silent = false;
  if (typeof opts.silent !== "undefined") {
    silent = opts.silent;
  }

  var replace = false;
  if (typeof opts.replace !== "undefined") {
    replace = opts.replace;
  }

  var body = opts.body || {};
  var locals = opts.locals || {};

  var parsedUrl = urlParser(path);
  var url = parsedUrl.format(parsedUrl);

  // If redirecting to self catch and do a full navigation
  var lastRoute = this.history[this.history.length - 1];
  if (lastRoute && lastRoute.method === method && lastRoute.path === url) {
    if (this.selfRedirectCount >= 50) {
      console.warn("isoRouter: Tried to navigate to same path more than 50 times.");
      return false;
    } else {
      this.selfRedirectCount++;
    }
  }

  // If navigating to a different host then want to do full navigation
  if ((parsedUrl.host && window.location && parsedUrl.host !== window.location.hostname) || opts.hard) {
    window.location.href = url;
    return false;
  }

  // request object, similar to express
  var req = {
    __id: this.reqIdx++,
    method: method,
    body: body,
    locals: locals,
    originalUrl: url,
    path: parsedUrl.pathname,
    query: parsedUrl.query,
    url: url
  };

  // response object, similar to express
  var res = {
    // Mimic functionality of express res.redirect
    redirect: function (url) {
      var address = url;
      var status = 302;
      var redirectOpts = {};

      // allow status / url
      if (arguments.length === 2) {
        if (typeof arguments[0] === "number") {
          status = arguments[0];
          address = arguments[1];
        } else {
          status = arguments[1];
        }
      } else if (arguments.length === 3) {
        address = arguments[0];
        status = arguments[1];
        redirectOpts = arguments[2];
      }
      this.statusCode = status;

      // If no replace is specified, defualt to true
      var shouldReplaceHistory = typeof redirectOpts.replace !== "undefined" ? redirectOpts.replace : true;

      return go.call(self, address, {
        silent: redirectOpts.silent,
        replace: shouldReplaceHistory,
        body: body,
        locals: locals
      });
    }
  };

  // opts.replace will replace the url without without triggering the route
  if (replace === true) {
    historyEnv.redirect(url);
    return true;
  }

  // opts.silent will trigger the route without changing the url
  if (silent === false) {
    historyEnv.go(url);
  }

  // Find the matching route based on url and method
  var foundHandlers = this.routes.map(function (handler) {
    return handler(req.method, req.path);
  }).filter(function (handler) {
    return handler;
  });

  // Create a next callback which iterates through middlewares
  var idx = 0;
  function next (err) {
    var func = foundHandlers[idx];
    idx++;

    if (err) {
      // Trigger the before navigate event
      self.emit("error", err, req, res);
      func(err, req, res, next);
    } else {
      func(req, res, next);
    }
  }

  if (foundHandlers.length > 0) {
    // Trigger the before navigate event
    this.emit("navigate", req, res);

    // Store the history
    this.history.push({
      method: method,
      path: url
    });

    // Reset scroll position
    window.scrollTo(0,0);

    // Iterate through the middlewares and routes
    next();

    // Return true so it's easy to determine if a route was found
    // This means we can do things like `preventDefault` on events
    return true;
  } else {
    return false;
  }
}

/**
 * add an event listener
 * @param {String}  eventName    name of event to listen for
 * @param {Function}  func       function to trigger on event
 * @returns {Void} no return
 */
function addListener (eventName, func) {
  if (this.listeners[eventName]) {
    this.listeners[eventName].push(func);
  }
}

/**
 * clientRouter - create an express compliant router for use in the browser
 * @param {Object}  opts           router configuration options
 * @param {String}  opts.inject    dom selector for element to replace on navigation
 * @returns {Object} express router
 */
module.exports = function clientRouter (opts) {
  opts = opts || {};

  var domEventHandler, router;

  // Setup the context
  var ctx = {
    // Store for event listeners
    listeners: {
      navigate: [], // event listeners for navigation events
      error: [] // event listeners for error events
    },
    // Trigger an event to all relevant listeners
    emit: function () {
      var args = Array.prototype.slice.call(arguments);
      var eventName = args[0];
      if (this.listeners[eventName]) {
        this.listeners[eventName].forEach(function (listener) {
          listener.call(args.slice(1));
        });
      }
    },
    routes: [], // Array of route handlers to be run through on each request
    history: [], // Array of objects containing request method and path
    selfRedirectCount: 0, // Count of how many times the same url has been hit
    reqIdx: 0 // incrementing count of each request
  };

  function removeDomEventHandler () {
    if (domEventHandler) {
      domEventHandler.destroy();
    }
  }

  // Expose the router API
  router = {
    get: addRouteHandler.bind(ctx, "get"),
    post: addRouteHandler.bind(ctx, "post"),
    put: addRouteHandler.bind(ctx, "put"),
    delete: addRouteHandler.bind(ctx, "delete"),
    use: addRouteHandler.bind(ctx, "use"),
    go: go.bind(ctx),
    on: addListener.bind(ctx),
    removeDomEventHandler: removeDomEventHandler,
    history: historyEnv
  };

  // When the url changes (such as back button) want to trigger the appropriate handler
  window.addEventListener("popstate", function () {
    var url = document.location.pathname + document.location.search;
    router.go(url, {
      silent: true
    });
  });

  // Injects a delegate event listener onto window or a specific node
  if (opts.inject) {
    domEventHandler = browserEnv.call(router, opts.inject);
  }

  return router;
};
