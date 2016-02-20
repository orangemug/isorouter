# isorouter
![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)

A router for both the client and the server with an express.js like API.

## How it works on the server

`require("isorouter")` will return a vanilla express router. However, it should only be used with isorouter compliant methods to ensure code will be compatibile.

## How it works on the browser

When run on a client it is easiest to think of isorouter as mounting an express server into the browser itself. The browser provides the incoming requests to the router via the url (pushstate) which are handled in an express like manner.

`require("isorouter")` will return an isoRouter. This mimics the functionality of express middleware and route matching.

To start the app trigger the first route with `router.go(window.location)`.

## Usage

### Create an isomorphic router

router.js
```js

/*
 * Create a router
 */
var router = isorouter({
  inject: true // Add event listeners to window which trigger navigation such as tags and forms
});

router.get("/users", function (req, res) {
    // call a function that renders on both client and server
})

module.exports = router;
```

### Server usage

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

### Client usage

client.js
```js
var router = require("./router");

/*
 * Trigger initial navigation
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

`router.go(url, opts)`

Performs a request to the router triggering any handlers listing on the given url.

Options:

* method: http method to call the url with such as `get`, `post`, `put`, `patch`, defaults to `get`.
* body: object passed to handler as `req.body`
* locals: object passed to handler as `req.locals`
* silent: trigger navigation without adding to pushstate
* replace: navigate replacing the last item in pushstate (useful for redirects to)

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
