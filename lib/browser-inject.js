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

/**
 * make a url from an href or action attribute into a url isoRouter can handle
 *
 * If clicking a link on a page hosted at /land?animal=badger#grass
 *
 * If a host or pathname there is enough to route
 * /sea                    -> /sea
 * /sea#weed               -> /sea#weed
 * /sea?fish=flounder      -> /sea?fish=flounder
 * /sea?fish=flounder#weed -> /sea?fish=flounder#weed
 *
 * If only a search query is given it is intended to be relative to the current path
 * ?fish=flounder          -> /land?fish=flounder
 * ?fish=flounder#weed     -> /land?fish=flounder#weed
 *
 * If only a hash is given it is intended to be relative to the current search query
 * #sea                    -> /land?animal=badger#sea
 *
 * @param {String}  url     input url to normalize
 * @returns {String} normalized url ensuring hash, search and path are appropriate
 */
function tidyUrl(url) {
  var urlParsed = Url.parse(url, true);

  if (!urlParsed.host && !urlParsed.pathname) {
    urlParsed.pathname = window.location.pathname;

    if (urlParsed.hash && !urlParsed.search) {
      urlParsed.search = window.location.search;
    }
  }

  return Url.format(urlParsed);
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
    var url = tidyUrl(target.getAttribute("action"));
    var method = target.getAttribute("method");
    submit(method, url, target)
    e.preventDefault();
  });

  delegate.on('click', 'input[formaction]', function(e, target) {
    var url = tidyUrl(target.getAttribute("formaction"));
    var method = target.getAttribute("formmethod");
    submit(method, url, target)
    e.preventDefault();
  });

  delegate.on('click', 'a', function(e, target) {
    // Ignore links with a target.
    if(!target.hasAttribute("target")) {
      var url = tidyUrl(target.getAttribute("href"));
      var ret = router.go(url, "get");

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
