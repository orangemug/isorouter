var url          = require("url");
var pathToRegexp = require('path-to-regexp');
var browserEnv   = require("./lib/browser-inject");
var historyEnv   = require("./lib/history");
var Qs           = require("qs");


function handler(method, path, fn, next) {
  var re = pathToRegexp(path, keys);
  var keys = re.keys;

  this.routes.push(function(_path, _method, req, res) {
    var pathname = url.parse(_path).pathname;

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

    var urlParsed = url.parse(_path, true);

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

function go(path, method, silent, body) {
  var self = this;
  method = method || "get";

  var ret = true;
  var req = {
		body: body
	};
  var res = {
    redirect: function(_path) {
      go.call(self, _path, "get");
      return;
    }
  };

  if(!silent) {
    historyEnv.go(path);
  }

  if(!ret) {
    return false;
  }
  this.routes.some(function(fn) {
    return fn(path, method, req, res);
  });
  return true;
}




module.exports = function(opts) {
  opts = opts || {};
 
  var env, router;

  var ctx = {
    routes: []
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

