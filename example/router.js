var isorouter = require("isorouter");

var router = isorouter();

router.use(require("isorouter/middlewares/html")({
  templates: [
    home:    fs.readFileSync(__dirname+"/views/home.html"),
    profile: fs.readFileSync(__dirname+"/views/profile.html")
  ],
  client: {
    element: "#root"
  }
}));

router.get("/", function (req, res) {
  res.render("home");
});

router.get("/profile", function (req, res) {
  res.send("profile");
});

module.exports = router;
