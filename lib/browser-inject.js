var Delegate = require("dom-delegate").Delegate;

module.exports = function(el) {
	var router = this;

  if (!el || el === true) {
    el = document.body;
  }
  // Allow you to pass selector
  else if (typeof(el) === "string") {
    el = document.querySelector(el);
  }

  var delegate = new Delegate(el);

  delegate.on('submit', 'form', function(e, target) {
    var url    = target.getAttribute("action");
    var method = target.getAttribute("method");

    router.go(url, method);
    e.preventDefault();
  });
  delegate.on('click', 'a', function(e, target) {
    var url = target.getAttribute("href");
    var ret = router.go(url, "get");
    if(ret) {
      e.preventDefault();
    }
  });

  return {
		destroy: function() {
			delegate.destroy();
		}
	};
}
