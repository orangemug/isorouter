var Url = require("url");
var location = require("./browser-apis/location");

/**
 * make a url object from an href or action attribute into a url isoRouter can handle
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
module.exports = function tidyUrl (url) {
  var parsedUrl = Url.parse(url, true);

  if (!parsedUrl.host && !parsedUrl.pathname) {
    parsedUrl.pathname = location.pathname;

    if (parsedUrl.hash && !parsedUrl.search) {
      parsedUrl.search = location.search;
    }
  }

  return parsedUrl;
};
