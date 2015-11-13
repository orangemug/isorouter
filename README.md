# isorouter
![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)

A router which works both on the server (in express apps) and inside browsers.

Isorouter actually exports two types of router depending on the environment but they are designed to have the same API so all downstream code runs in the same way.

## How it works on the server

`require("isorouter")` will return a vanilla express router.

This router can be used as per an express router. However, it should only be used with isorouter compliant methods to ensure isomorphic compatibility.

## How it works on the browser

When run on a client it is easiest to think of isorouter as mounting an express server into the browser itself. The browser provides the incoming requests to the router which are handled in an express like manner.

When building a JavaScript package with browserify `require("isorouter")` will return an clientRouter. This works because browserify uses the 'browser' value of `package.json` to load a script instead of the usual 'main' value.

To mount the browserRouter into the browser it must be 'executed' using `router.go()`.

This sets up delegate handlers to listen for events such as url changes, clicks on `a` tags and submit events from `form` tags. These events will trigger the router methods. 

## Usage

## Create a router

router.js
```js

/*
 * Create a router
 */
var router = isorouter({
  inject: "#app" // on the client the #app element will be replaced
});

router.get("/users", function (req, res) {
    // call a function that renders on both client and server
})

module.exports = router;
```

## Server usage

server.js
```js
var isorouter = require("./router");


/*
 * Create an express app
 */
var express = require("express");
var app = express();

/*
 * Mount the router
 */
app.use(router)

/*
 * Start the app
 */
app.listen(3000, function () {
  console.log("Started");
});
```

When a request comes into the express server isorouter will handle it like normal express middleware and result in a server side render.

## Client usage

client.js
```js
var router = require("./router");

/*
 * Mount the router and start the app
 */
router.go();
```

In our example, if a user clicks a link such as `<a href="/users">Click here</a>` the event will propagate up and be handled by isorouter. It will:

* prevent default navigation
* change the url via pushstate
* the router will pick up on the url change and run the associated handler.
* The handler can call an isomorphic render to update the view/dom.

## Reference

### Browser specific functions

`router.go(url, method, silent, data)`

Go will mount the router into the browser and start listening for events and url changes. It will also do a first time trigger with the current url (via get).

`router.destroy()`

Removes all delegate and url listeners.

`router.history`

Exports an object with functionality to manipulate push state history.

* `go(url)` - go to a given url
* `back()` - go the the previous page in push state (if present)
* `forward()` - go to the next page in push state (if present)
* `redirect(url, state)` - go to a url and replace the existing pushstate

### Isomorphic functions

`router.use(url, middleware)`

Insert a middleware into the router which is run on all request methods (GET, POST, PUT etc). The middleware function will normally call `next(err)` at the end of it's execution to trigger the next middlware/handler.

`router.get(url, handler)`

Listen for get url's and trigger the handler.

`router.post(url, handler)`

Listen for POST on the server and form submissions on the client and trigger the handler.

`router.put(url, handler)`

Listen for PUT on the server and form submissions on the client and trigger the handler.

`router.delete(url, handler)`

Listen for DELETE on the server and form submissions on the client and trigger the handler.

## Browser implementation detail

It is worth noting that isorouter adds various delegate handlers into the window object of the browser. These are designed to make it easy to handle a tags and form submissions.

See `lib/browser-inject.js` for details.

`<a>` tags

Any <a> tag click will be handled unless it has a `target` set. This means all internal links will go through isorouter. To link to an external page or an internal page with a browser refresh add a `target`.

`<form>` tags

Any submit event will be handled unless handled further down the dom with `stopPropagation`. Isorouter will serialize the form into a flat json object and submit it as the request body to the router.

`<input type="submit">` tags

Click events on submit tags will be handled as per form tags.

## Gotchas

Currently the `clientRouter` doesn't support using `use` without a url. This can be easily overcome by using `router.use("/*", middleware)`.

The form serialization can only create flat JSON objects. For nested objects your JS will have to build the JSON and call the routing directly. `router.go(url, method, false, {my: {nested: {json: "object"}}})`.

