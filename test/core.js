var assert = require("assert");
var core = require("../lib/core");

function FnLog() {
  var data = {};
  var out = function(token) {
    data[token] = true;
  };
  out.test = function(token) {
    return !!data[token];
  }
  return out;
}

describe("core", function() {
  var router, fnLog;

  beforeEach(function() {
    fnLog = FnLog();
    router = core();

    router.use(function(req, res, next) {
      fnLog("middleware.1");
      next();
    });

    router.use(function(req, res, next) {
      fnLog("middleware.2");
      next();
    });

    router.error(function(err, req, res, next) {
      fnLog("root.error.1")
      next();
    });

    router.error(function(err, req, res, next) {
      fnLog("root.error.2")
      next();
    });

    var subRouter = core();
    subRouter.delete("/", fnLog.bind(null, "subroot.delete"));
    subRouter.get("/",    fnLog.bind(null, "subroot.get"));
    subRouter.post("/",   fnLog.bind(null, "subroot.post"));
    subRouter.put("/",    fnLog.bind(null, "subroot.put"));

    router.use("/sub", subRouter);

    router.delete("/", fnLog.bind(null, "root.delete"));
    router.get("/",    fnLog.bind(null, "root.get"));
    router.post("/",   fnLog.bind(null, "root.post"));
    router.put("/",    fnLog.bind(null, "root.put"));

    router.get("/method-middleware",
      function(req, res, next) {
        fnLog("root.method-middleware.middleware");
        next();
      },
      fnLog.bind(null, "root.method-middleware.get")
    );

    router.get("/error", function() {
      throw "Fail!";
    })

    router.get("/error-promise", function() {
      return Promise.reject("foo");
    })

    router.get("/no-error-promise", function() {
      return Promise.resolve("foo")
        .then(function() {
          fnLog("root.no-error-promise");
        });
    })
  })

  it("[DEL]  /", function() {
    router({method: "delete", basePath: "/"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.delete"));
  });

  it("[GET]  /", function() {
    router({method: "get", basePath: "/"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.get"));
  });

  it("[POST] /", function() {
    router({method: "post", basePath: "/"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.post"));
  });

  it("[PUT]  /", function() {
    router({method: "put", basePath: "/"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.put"));
  });

  it("[DEL]  /sub/", function() {
    router({method: "get", basePath: "/sub"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("subroot.get"));
  })

  it("[GET]  /sub/", function() {
    router({method: "delete", basePath: "/sub"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("subroot.delete"));
  })

  it("[POST] /sub/", function() {
    router({method: "post", basePath: "/sub"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("subroot.post"));
  })

  it("[PUT]  /sub/", function() {
    router({method: "put", basePath: "/sub"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("subroot.put"));
  })

  it("[GET]  /method-middleware", function() {
    router({method: "get", basePath: "/method-middleware"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.method-middleware.middleware"));
    assert(fnLog.test("root.method-middleware.get"));
  });

  it("[GET]  /method-middleware", function() {
    router({method: "get", basePath: "/method-middleware"});

    assert(fnLog.test("middleware.1"));
    assert(fnLog.test("middleware.2"));
    assert(fnLog.test("root.method-middleware.middleware"));
    assert(fnLog.test("root.method-middleware.get"));
  })

  it("[GET]  /error", function() {
    router({method: "get", basePath: "/error"});

    assert(fnLog.test("root.error.1"));
    assert(fnLog.test("root.error.2"));
  })

  it("[GET]  /error-promise", function(done) {
    router({method: "get", basePath: "/error-promise"});

    process.nextTick(function() {
      assert(fnLog.test("root.error.1"));
      assert(fnLog.test("root.error.2"));
      done();
    });
  })

  it("[GET]  /no-error-promise", function(done) {
    router({method: "get", basePath: "/no-error-promise"});

    // HACK
    setTimeout(function() {
      assert(fnLog.test("root.no-error-promise"));
      done();
    }, 100);
  })

});
