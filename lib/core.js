var pathToRegexp = require("path-to-regexp");


module.exports = function() {
  var middleware = [];
  var errorMiddleware = [];

  function _run(req, res, next, idx) {
    idx = idx || 0;

    for(idx; idx<middleware.length; idx++) {
      var route = middleware[idx];

      var match = route.regexp.test(req.basePath);
      function checkMethod() {
        if(route.method) {
          return (route.method === req.method);
        }
        return true;
      }

      if(match && checkMethod(req.method)) {
        var newReq = Object.assign({}, req, {
          basePath: req.basePath.replace(route.regexp, "/")
        });

        var exited = false;

        try {
          var ret = route.fn(newReq, res, function(err) {
            exited = true;
            if(err) {
              _error(err, req, res, next);
            }
            else {
              _run(req, res, next, idx+1);
            }
          });


          if(ret.then && ret.catch) {
            ret.catch(function(err) {
              exited = true;
              _error(err, req, res, next);
            });
          }
        } catch(err) {
          if(!exited) {
            _error(err, req, res, next);
          }
        }

        break;
      }
    }
  }

  function _error(err, req, res, next, idx) {
    idx = idx || 0;

    for(idx; idx<errorMiddleware.length; idx++) {
      var errorRoute = errorMiddleware[idx];

      var match = errorRoute.regexp.test(req.basePath);

      if(match) {
        var newReq = Object.assign({}, req, {
          basePath: req.basePath.replace(errorRoute.regexp, "/")
        });

        errorRoute.fn(err, newReq, res, function() {
          _error(err, req, res, next, idx+1);
        });

        break;
      }
    }
  }

  function run(req, res, next) {
    return _run(req, res, next);
  }

  function checkReq(req) {
    var simplifiedReq = pick(req, [
      "params",
      "method",
      "path",
      "url",
      "originalUrl",
      "baseUrl",
      "body",
      "hostname",
      "protocol",
      "query",
      "secure",
      "subdomains",
    ]);
  }

  // function hdl(path, hdl) {
  //   return function(_req, _res) {
  //     var req = {
  //       params:        req.params,
  //       method:        req.method,
  //       path:          req.path,
  //       url:           req.url,
  //       originalUrl:   req.originalUrl,
  //       baseUrl:       req.baseUrl,
  //       body:          req.body,
  //       hostname:      req.hostname,
  //       protocol:      req.protocol,
  //       query:         req.query,
  //       secure:        req.secure,
  //       subdomains:    req.subdomains,
  //       route:         req.route
  //     };

  //     res = {
  //       send: function(data) {
  //         throw "Must override this if you want to use it, else just use middleware.";
  //       }
  //     }

  //     var runners = middleware.concat(hdl);
  //     run(req, res);
  //   }
  // }

  function parse(path, fns, obj) {
    obj = Object.assign({
      middleware: middleware
    }, obj);

    var keys = [];
    var regexp = pathToRegexp(path, keys);

    fns.forEach(function(fn) {
      obj.middleware.push({
        regexp: regexp,
        keys: keys,
        method: obj.method,
        fn: fn
      });
    });
  };

  run.use = function() {
    if(arguments.length === 1) {
      parse("/*", Array.prototype.slice.call(arguments, 0));
    }
    else {
      parse(arguments[0], Array.prototype.slice.call(arguments, 1));
    }
  }

  run.error = function() {
    if(arguments.length === 1) {
      var args = Array.prototype.slice.call(arguments, 0);
      parse("/*", args, {
        middleware: errorMiddleware
      });
    }
    else {
      var args = Array.prototype.slice.call(arguments, 1);
      parse(arguments[0], args, {
        middleware: errorMiddleware
      });
    }
  }

  var methods = [
    "delete",
    "get",
    "post",
    "put",
  ];

  methods.forEach(function(method) {
    run[method] = function(path) {
      parse(path, Array.prototype.slice.call(arguments, 1), {method: method});
    }
  });

  return run;
}
