var isorouter = require("../");
var React = require("react");
var User = require("./elements/user");
var UserEdit = require("./elements/user_edit");
var Root = require("./elements/root");

var router = isorouter({
  inject: ".app"
});

// Just some dummy data
var user = {
  firstName: "Jamie",
  lastName: "Blair"
};

router.use("/*", function(req, res) {
  res.renderReact = function(element, data) {
    React.render(
      React.createElement(element, data),
      document.querySelector(".app")
    );
  };
});

router.get("/", function(req, res) {
  res.renderReact(Root, {
    links: [
      {name: "User", href: "/user"}
    ]
  });
});

router.get("/user", function(req, res) {
  res.renderReact(User, user);
});

router.get("/user/edit", function(req, res) {
  res.renderReact(UserEdit, user);
});

router.put("/user", function(req, res) {
  user.firstName = req.body.firstName;
  user.lastName  = req.body.lastName;

  res.renderReact(User, user);
});


module.exports = router;
