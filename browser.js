var Url          = require("url");
var pathToRegexp = require("path-to-regexp");
var browserEnv   = require("./lib/dom_event_handler");
var historyEnv   = require("./lib/history");
var Qs           = require("qs");

/**
 * make a url from an href or action attribute into a url isoRouter can handle
 *
 * If clicking a link on a page hosted at /land?animal=badger#grass
 *
 * If a host or pathname there is enough to route
 * /sea                    -> /sea
 * /sea#weed               -> /sea#weed
 * /sea?fish=flounder      -> /sea?fish=flounder
 * /sea?fish=flounder#weed -> /sea?fish=flounder#weed
 *
 * If only a search query is given it is intended to be relative to the current path
 * ?fish=flounder          -> /land?fish=flounder
 * ?fish=flounder#weed     -> /land?fish=flounder#weed
 *
 * If only a hash is given it is intended to be relative to the current search query
 * #sea                    -> /land?animal=badger#sea
 *
 * @param {String}  url     input url to normalize
 * @returns {String} normalized url ensuring hash, search and path are appropriate
 */
function tidyUrl (url) {
  var parsedUrl = Url.parse(url, true);

  if (!parsedUrl.host && !parsedUrl.pathname) {
    parsedUrl.pathname = window.location.pathname;

    if (parsedUrl.hash && !parsedUrl.search) {
      parsedUrl.search = window.location.search;
    }
  }

  return parsedUrl;
}

/**
 * handler - create a route handler
 * @param {String}    method        http method (GET, POST, PUT, DELETE)
 * @param {String}    path          path to navigate to
 * @param {Function}  fn            middleware function
 * @param {Function}  next          call the next item in the middleware stack
 * @returns {undefined}
 */
function handler (method, path, fn, next) {
  var re = pathToRegexp(path);
  var keys = re.keys;

  this.routes.push(function (_path, _method, req, res) {
    var pathname = Url.parse(_path).pathname;

    if (method !== "use" && method !== _method) {
      return false;
    }

    var results = re.exec(pathname);
    if (!results) {
      return false;
    }

    var params = {};
    keys.forEach(function (key, idx) {
      params[key.name] = results[idx+1];
    });

    req.params = params;

    var parsedUrl = Url.parse(_path, true);

    req.path  = parsedUrl.pathname;
    req.query = parsedUrl.query;
    req.url   = parsedUrl.pathname + "?" + Qs.stringify(parsedUrl.query);

    if (method === "use") {
      // HACK: next
      fn(req, res, function () {});
      return false;
    } else {
      fn(req, res);
      return true;
    }
  });
}

var uid = 0;

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

  opts = opts || {};

  var method = opts.method || "get";
  var silent = opts.silent || false;
  var replace = opts.replace || false;
  var body = opts.body || {};
  var locals = opts.locals || {};

  var parsedUrl = tidyUrl(path);

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
  if (parsedUrl.host && window.location && parsedUrl.host !== window.location.hostname) {
    window.location.href = url;
    return false;
  }

  // request object, similar to express
  var req = {
    __id: uid++,
    body: body,
    locals: locals
  };

  // response object, similar to express
  var res = {

    // Mimic functionality of express res.redirect
    redirect: function (url) {
      var address = url;
      var status = 302;
      var opts = {};

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
        opts = arguments[2];
      }
      this.statusCode = status;

      return go.call(self, address, {
        silent: opts.silent,
        replace: opts.replace,
        body: opts.body,
        locals: opts.locals
      });
    }
  };

  // If replace then redirect replacing the last item in window.history
  if (replace) {
    historyEnv.redirect(url);
    return true;
  } else if (!silent) {
    historyEnv.go(url);
  }

  // Find the matching route based on url and method
  var isRouteFound = this.routes.some(function (fn) {
    return fn(url, method, req, res);
  });

  if (isRouteFound) {
    // Store the history
    this.history.push({
      method: method,
      path: url
    });

    // Reset scroll position
    window.scrollTo(0,0);

    // return true to prevent default navigation
    return true;
  } else {
    return false;
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

  var ctx = {
    routes: [],
    history: [],
    selfRedirectCount: 0
  };

  function removeDomEventHandler () {
    if (domEventHandler) {
      domEventHandler.destroy();
    }
  }

  // When the url changes (such as back button) want to trigger the appropriate handler
  window.addEventListener("popstate", function () {
    var url = document.location.pathname + document.location.search;
    go.call(ctx, url, {
      silent: true
    });
  });

  // Expose the router API
  router = {
    get: handler.bind(ctx, "get"),
    post: handler.bind(ctx, "post"),
    put: handler.bind(ctx, "put"),
    delete: handler.bind(ctx, "delete"),
    use: handler.bind(ctx, "use"),
    go: go.bind(ctx),
    removeDomEventHandler: removeDomEventHandler,
    history: historyEnv
  };

  // Injects a delegate event listener onto window or a specific node
  if (opts.inject) {
    domEventHandler = browserEnv.call(router, opts.inject);
  }

  return router;
};
