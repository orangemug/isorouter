var history = require("./browser-apis/history");

var idx = 0;

module.exports = {
  go: function (url) {
    try {
      history.pushState(idx, null, url);
      idx++;
      return true;
    } catch (err) {
      // Just fail silently, because not a local url... kinda lame.
    }
    return false;
  },
  back: function () {
    history.back();
  },
  forward: function () {
    history.forward();
  },
  redirect: function (url, stateObj) {
    history.replaceState(stateObj, null, url);
  }
};
