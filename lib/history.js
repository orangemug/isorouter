var Url = require("url");


function getReq(url, defaultReq) {
  var urlDef = Url.parse(url);

  return Object.assign({
    path:        urlDef.path,
    url:         urlDef.url,
    originalUrl: urlDef.originalUrl,
    baseUrl:     urlDef.baseUrl,
    hostname:    urlDef.hostname,
    protocol:    urlDef.protocol,
    query:       urlDef.query,
    subdomains:  urlDef
      .hostname
      .split(".")
      .slice(0, -2),
    secure: function() {
      return 'https' == req.protocol;
    },
  }, defaultReq);
}


module.exports = function(router) {
  window.addEventListener("popstate", function hdl() {
    var url = document.location.pathname + document.location.search;

    router(
      getReq(url, {method: "get"})
    );
  });

  return {
    destroy: function() {
      window.removeEventListener("popstate", hdl);
    }
  }
}
