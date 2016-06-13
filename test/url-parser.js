var assert     = require("assert");
var proxyquire = require("proxyquire").noCallThru();


var urlParser  = proxyquire("../lib/url-parser", {
  "./browser-apis/location": {
    pathname: "/path/not/set",
    search: "?no=search"
  }
});

var tests = {
  "/path/set": {
    pathname: "/path/set",
    search:   "",
    hash:     null,
  },
  "/path/set#hash": {
    pathname: "/path/set",
    search:   "",
    hash:     "#hash",
  },
  "/path/set?is=set": {
    pathname: "/path/set",
    search:   "?is=set",
    hash:     null,
  },
  "/path/set?is=set#hash": {
    pathname: "/path/set",
    search:   "?is=set",
    hash:     "#hash",
  },
  "?is=set": {
    pathname: "/path/not/set",
    search:   "?is=set",
    hash:     null,
  },
  "?is=set#hash": {
    pathname: "/path/not/set",
    search:   "?is=set",
    hash:     "#hash",
  },
  "#hash": {
    pathname: "/path/not/set",
    search:   "?no=search",
    hash:     "#hash",
  },
};

describe("url-parser", function() {
  Object.keys(tests).forEach(function(url) {
    var results = tests[url];

    it("should parse url: <"+url+">", function() {
      var out = urlParser(url);
      assert.equal(out.pathname, results.pathname, "pathname");
      assert.equal(out.hash,     results.hash);
      assert.equal(out.search,   results.search);
    });
  });
});
