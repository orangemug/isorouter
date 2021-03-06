var Url = require("url");
var Delegate = require("dom-delegate").Delegate;
var lodash = {
  set: require("lodash.set")
};

function getFormEl (el) {
  while (el && el.nodeName !== "FORM") {
    el = el.parentNode;
  }
  return el;
}

function getFormData (el) {
  var formEl = getFormEl(el);

  var inputElems = formEl.querySelectorAll("input[name], textarea[name], select[name], button[name]");
  var out = {};
  for (var i=0; i < inputElems.length; i++) {
    var inputElem = inputElems[i];
    var name = inputElem.getAttribute("name");
    if (inputElem.getAttribute("type") === "checkbox") {
      lodash.set(out, name, inputElem.checked);
    } else {
      lodash.set(out, name, inputElem.value);
    }
  }
  return out;
}

module.exports = function (el) {
  var router = this;

  if (!el || el === true) {
    // bind to window as react listens on document, stopPropagation from react
    // will not work unless isorouter listens on a higher level
    el = window;
  }
  // Allow you to pass selector
  else if (typeof(el) === "string") {
    el = document.querySelector(el);
  }

  var delegate = new Delegate(el);

  function submit (method, url, target) {
    var data = getFormData(target);

    var urlParsed = Url.parse(url, true);
    if (data._method || urlParsed.query && urlParsed.query._method) {
      method = data._method || urlParsed.query._method;
    }

    var outUrl = {
      protocol: urlParsed.protocol,
      host: urlParsed.host,
      pathname: urlParsed.pathname
    };

    // Combine form data and url data taking form data in precidence
    if (method === "get" && urlParsed.query) {
      Object.keys(urlParsed.query).forEach(function (key) {
        data[key] = data[key] || urlParsed.query[key];
      });
      outUrl.query = data;
    }

    return router.go(Url.format(outUrl), {
      method: method,
      body: data,
      replace: target.getAttribute("data-isorouter-replace") ? true : false,
      silent: target.getAttribute("data-isorouter-silent") ? true : false,
      hard: target.getAttribute("data-isorouter-hard") ? true : false
    });
  }

  delegate.on("submit", "form", function (e, target) {
    var url = target.getAttribute("action");
    var method = target.getAttribute("method");
    // Only do isorouter if we find the route, otherwise do browser default
    if (submit(method, url, target)) {
      e.preventDefault();
    }
  });

  delegate.on("click", "input[formaction]", function (e, target) {
    var url = target.getAttribute("formaction");
    var method = target.getAttribute("formmethod");
    // Only do isorouter if we find the route, otherwise do browser default
    if (submit(method, url, target)) {
      e.preventDefault();
    }
  });

  delegate.on("click", "a", function (e, target) {
    // Ignore links with a target.
    if (!target.hasAttribute("target") && !(e.metaKey || e.shiftKey || e.ctrlKey)) {
      var url = target.getAttribute("href");
      var preventScrollReset = target.getAttribute("data-prevent-scroll-reset");

      // Only do isorouter if we find the route, otherwise do browser default
      if (router.go(url, {preventScrollReset: preventScrollReset})) {
        e.preventDefault();
      }
    }
  });

  return {
    destroy: function () {
      delegate.destroy();
    }
  };
};
