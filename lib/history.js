var history = window.history;

var idx = 0;

module.exports = {
  go: function(url, stateObj) {
    try {
      history.pushState(idx, null, url);
      return true;
    } catch(err) {
      // Just fail silently, because not a local url... kinda lame.
    }
    return false;
  },
  back: function() {
    history.back();
  },
  forward: function() {
    history.forward();
  },
  redirect: function(url, stateObj) {
    history.replaceState(stateObj, null, url);
  }
}
