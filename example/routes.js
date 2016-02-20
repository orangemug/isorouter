var isorouter = require("../");
var React = require("react");
var User = require("./elements/user");
var UserEdit = require("./elements/user_edit");
var Root = require("./elements/root");
var Error = require("./elements/error");

var router = isorouter({
  inject: true
});

// Just some dummy data
var user = {
  firstName: "Jamie",
  lastName: "Blair"
};

router.use("/*", function (req, res, next) {
  req.locals.middleware1 = true;
  res.renderReact = function (element, data) {
    React.render(
      React.createElement(element, data),
      document.querySelector(".app")
    );
  };
  next();
});

router.use("/*", function (req, res, next) {
  setTimeout(function () {
    if (!req.locals.middleware1) {
      next(new Error("middleware 1 was not processed"));
    } else {
      req.locals.middleware2 = true;
      next();
    }
  }, 200);
});

router.use("/*", function (req, res, next) {
  req.locals.middleware3 = true;
  if (!req.locals.middleware2) {
    next(new Error("middleware 2 was not processed"));
  } else {
    next();
  }
});

router.get("/", function (req, res) {
  res.renderReact(Root, {
    links: [
      {name: "User", href: "/user"}
    ]
  });
});

router.get("/user", function (req, res) {
  res.renderReact(User, user);
});

router.get("/user/edit", function (req, res) {
  res.renderReact(UserEdit, user);
});

router.put("/user", function (req, res, next) {
  user.firstName = req.body.firstName;
  user.lastName  = req.body.lastName;

  if (req.body.triggerErr) {
    next(new Error("Error triggered"));
  } else {
    res.renderReact(User, user);
  }
});

router.use("/*", function (err, req, res) {
  res.renderReact(Error, {
    error: err
  });
});


module.exports = router;
