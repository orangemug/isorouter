var express = require("express");

module.exports = function(opts) {
  var router = new express.Router;

  function hdl(method) {
    function(req, res) {
      return router[method](req, res);
    }
  }

  return {
    use:    hdl("use"),
    get:    hdl("get"),
    put:    hdl("put"),
    post:   hdl("post"),
    delete: hdl("delete")
  };
};
