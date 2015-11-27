var Url = require("url");
var Qs = require("qs");
var Delegate = require("dom-delegate").Delegate;


function getFormEl(el) {
  while(el && el.nodeName !== "FORM") {
    el = el.parentNode;
  }
  return el;
}

function getFormData(el) {
  var formEl = getFormEl(el);

  var els = formEl.querySelectorAll("input[name], textarea[name], select[name]");
  var out = {};
  for(var i=0; i<els.length; i++) {
    var el = els[i];
    var name = el.getAttribute("name");
    if(el.getAttribute("type") === "checkbox") {
      out[name] = el.checked;
    } else {
      out[name] = el.value;
    }
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

  function submit(method, url, target) {
    var data = getFormData(target);

    var urlParsed = Url.parse(url, true);
    if(urlParsed.query && urlParsed.query._method) {
      method = urlParsed.query._method;
    }

    if(method === "get") {
      url = url + "?" + Qs.stringify(data);
      router.go(url, method, false);
    } else {
      router.go(url, method, false, data);
    }
  }

  delegate.on('submit', 'form', function(e, target) {
    var url    = target.getAttribute("action");
    var method = target.getAttribute("method");
    submit(method, url, target)
    e.preventDefault();
  });

  delegate.on('click', 'input[formaction]', function(e, target) {
    var url    = target.getAttribute("formaction");
    var method = target.getAttribute("formmethod");
    submit(method, url, target)
    e.preventDefault();
  });

  delegate.on('click', 'a', function(e, target) {
    // Ignore links with a target.
    if(!target.hasAttribute("target")) {
      var url    = e.target.href;
      var ret    = router.go(url, "get");

      if(ret) {
        e.preventDefault();
      }
    }
  });

  return {
    destroy: function() {
      delegate.destroy();
    }
  };
}
