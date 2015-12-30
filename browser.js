var Url          = require("url");
var pathToRegexp = require('path-to-regexp');
var browserEnv   = require("./lib/browser-inject");
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
function tidyUrl(url) {
  var urlParsed = Url.parse(url, true);

  if (!urlParsed.host && !urlParsed.pathname) {
    urlParsed.pathname = window.location.pathname;

    if (urlParsed.hash && !urlParsed.search) {
      urlParsed.search = window.location.search;
    }
  }

  return Url.format(urlParsed);
}

/**
 * handler - create a route handler
 * @param {String}    method        http method (GET, POST, PUT, DELETE)
 * @param {String}    path          path to navigate to
 * @param {Function}  fn            middleware function
 * @param {Function}  next          call the next item in the middleware stack
 * @returns {undefined}
 */
function handler(method, path, fn, next) {
  var re = pathToRegexp(path);
  var keys = re.keys;

  this.routes.push(function(_path, _method, req, res) {
    var pathname = Url.parse(_path).pathname;

    if(method !== "use" && method !== _method) {
      return false;
    }

    var results = re.exec(pathname);
    if(!results) {
      return false;
    }

    var params = {};
    keys.forEach(function(key, idx) {
      params[key.name] = results[idx+1];
    });

    req.params = params;

    var urlParsed = Url.parse(_path, true);

    req.path  = urlParsed.pathname;
    req.query = urlParsed.query;
    req.url   = urlParsed.pathname + "?" + Qs.stringify(urlParsed.query);

    if(method === "use") {
      // HACK: next
      fn(req, res, function() {});
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
 * @param {String}    method        http method (GET, POST, PUT, DELETE)
 * @param {Boolean}   silent        if silent the item isn't added to pushstate history
 * @param {Object}    body          request body to send
 * @param {Object}    locals        extra data such as a flash message
 * @returns {Boolean} if the request was sent
 */
function go(path, method, silent, body, locals) {
  var self = this;
  method = method || "get";

  path = tidyUrl(path);

  var lastRoute = this.history[this.history.length - 1];
  if (lastRoute && lastRoute.method === method && lastRoute.path === path) {
    console.warn("isoRouter: Trying to navigate to same path.", lastRoute);
  }

  var req = {
    __id: uid++,
    body: body,
    locals: locals
  };
  var res = {
    redirect: function(_path, silent, data, locals) {
      go.call(self, _path, "get", silent, data, locals);
      return;
    }
  };

  if(!silent) {
    historyEnv.go(path);
  }

  var isRouteFound = this.routes.some(function(fn) {
    return fn(path, method, req, res);
  });

  if (isRouteFound) {
    // Store the history
    this.history.push({
      method: method,
      path: path
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
 * @return {Object} express router
 */
module.exports = function clientRouter (opts) {
  opts = opts || {};

  var env, router;

  var ctx = {
    routes: [],
    history: []
  };

  function destroy() {
    if(env) {
      env.destroy();
    }
  }

  window.addEventListener("popstate", function(e) {
    var url = document.location.pathname + document.location.search;
    go.call(ctx, url, "get", true);
  });

  router = {
    get: handler.bind(ctx, "get"),
    post: handler.bind(ctx, "post"),
    put: handler.bind(ctx, "put"),
    delete: handler.bind(ctx, "delete"),
    use: handler.bind(ctx, "use"),
    go: go.bind(ctx),
    destroy: destroy,
    history: historyEnv
  };

  if(opts.inject) {
    env = browserEnv.call(router, opts.inject);
  }

  return router;
};
