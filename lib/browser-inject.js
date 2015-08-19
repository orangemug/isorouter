var Url = require("url");
var Delegate = require("dom-delegate").Delegate;

function getFormData(formEl) {
	var els = formEl.querySelectorAll("input[name], textarea[name], select[name]");
	var out = {};
	for(var i=0; i<els.length; i++) {
		var el = els[i];
		var name = el.getAttribute("name");
		out[name] = el.value;
	}
	return out;
}

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
		var data   = getFormData(el);

    var urlParsed = Url.parse(url, true);
    if(urlParsed.query && urlParsed.query._method) {
      method = urlParsed.query._method;
    }

    router.go(url, method, false, data);
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
