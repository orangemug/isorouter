var isorouter = require("../");
var React = require("react");
var ReactDom = require("react-dom");
var ReactDomServer = require("react-dom/server");
var elements = require("./elements");

var router = isorouter({
  inject: true
});

// Just some dummy data
var user = {
  firstName: "Jamie",
  lastName: "Blair"
};

//
// Middleware handlers
//

// Middleware to setup render method
router.use(function (req, res, next) {
  res.renderReact = function (element, data) {
    var wrappedElement = React.createElement(elements.layout, data,
      React.createElement(element, data)
    );
    if (typeof window !== "undefined" && global === window) {
      ReactDom.render(
        wrappedElement,
        document.querySelector(".app")
      );
    } else {
      console.log("server render");
      var html = ReactDomServer.renderToString(wrappedElement);
      res.render("index", {html: html});
    }
  };
  next();
});

// Middleware to setup req.locals and trigger async middleware
router.use(function (req, res, next) {
  req.locals = {};
  setTimeout(function () {
    req.locals.middleware1 = true;
    next();
  }, 200);
});

// Middleware to test async middleware handling
router.use(function (req, res, next) {
  if (!req.locals.middleware1) {
    next(new Error("middleware 1 was not processed"));
  } else {
    next();
  }
});

//
// Route handlers
//

router.get("/", function (req, res) {
  res.renderReact(elements.root, {
    links: [
      {name: "User", href: "/user"}
    ]
  });
});

router.get("/user", function (req, res) {
  res.renderReact(elements.user, user);
});

router.get("/user/edit", function (req, res) {
  res.renderReact(elements.userEdit, user);
});

router.put("/user", function (req, res, next) {
  user.firstName = req.body.firstName;
  user.lastName  = req.body.lastName;

  if (req.body.triggerErr) {
    next(new Error("Form error triggered"));
  } else {
    res.renderReact(elements.user, user);
  }
});

//
// Error handlers
//

router.use(function (err, req, res, next) {
  res.renderReact(elements.error, {
    err: err
  });
});


module.exports = router;
