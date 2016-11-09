'use strict';

const pathToRegexp     = require('path-to-regexp');
const Layer            = require('./Layer');
const Utils            = require('./../Utils');
const supportedMethods = require('./../methods');

supportedMethods.push('all');
module.exports = class Route {
  constructor(basePath) {
    this.basePath = basePath;
    this._parent = null;
    this._methods = {};
    //todo questo se ne andra'
    this._routeIndex = null;
    this.stack = [];

    Utils.forEach(supportedMethods, method => {
      this[method] = function() {
        this._addLayers(method, Array.from(arguments));
        return this;
      };
    });

    return this;
  }

  _addLayers(method, handles) {
    if (this.started) return this;

    Utils.forEach(handles, handle => {
      const type = typeof handle;

      if (type !== 'function') {
        throw new TypeError(`Route.${method}() requires callback functions but got a ${type}`);
      }

      this._methods[method] = true;
      this.stack.push(new Layer(method, handle));
    });
  }

  get _options() {
    const methods = Object.keys(this.methods);

    // append automatic head
    if (this.methods.get && !this.methods.head) methods.push('head');

    // make upper case
    Utils.forEach(methods, (method, i) => methods[i] = method.toUpperCase());

    return methods;
  }

  get started() {
    if (this._parent) return this._parent.started;
    return false;
  }

  get path() {
    if (this._parent) return Utils.joinUrls(this._parent.path, this.basePath);
    return this.basePath;
  }

  //todo sparisce
  getNextLayer(req, res, stackStartIndex) {
    return (arg) => {
      if (typeof stackStartIndex === 'undefined') stackStartIndex = 0;

      let fn;
      let next;

      const l = this.stack.length;
      if (stackStartIndex < l && arg !=='route') {
        for (let i = stackStartIndex; i < l; i++) {
          const layer = this.stack[i];
          if (layer.match(req)) {
            fn = layer.handle;
            break;
          }
          stackStartIndex++;
        }

        next = this.getNextLayer(req, res, stackStartIndex + 1);

      } else {
        fn = this._parent.getNextRoute(req, res, this._routeIndex + 1).getNextLayer(req, res);
      }

      if (!next) {
        next = this._parent.getNextRoute(req, res, this._routeIndex + 1).getNextLayer(req, res);
      }

      //try {
        fn(req, res, next);
      //} catch(err) {
      //  res.status(500).send(err.stack);
     // }
    };
  }

  dispatch(req, res, done) {
    let idx = 0;
    const stack = this.stack;
    if (stack.length === 0) return done();

    let method = req.method;
    if (method === 'head' && !this.methods['head']) method = 'get';

    req.route = this;

    next();

    function next(err) {
      if (err === 'route') return done();

      const layer = stack[idx++];

      if (!layer) return done(err);

      if (layer.match(method)) return next(err);

      if (err) layer.handle_error(err, req, res, next);
      else layer.handle_request(req, res, next);
    }
  }

  mount(parent) {
    this._parent = parent;
    //todo da togliere appena si leva _routeindex
    this._routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this
  }

  _handlesMethod(method) {
    if (this._methods.all) return true;
    if (method === 'head' && !this._methods['head']) method = 'get';
    return this._methods[method];
  };

  _matchPath(req, settings) {
    const path = this.path;
    if (this.path === '*') return true;

    const keys = [];
    const re = pathToRegexp(path, keys, settings);
    const m = re.exec(req.path);
    if (!m) return false;

    req.params = req.params || {};
    Utils.forEach(keys, (key, i) => {
      const param = m[i + 1];
      if (param){
        req.params[key.name] = Utils.decodeURIParam(param);
        if (key.repeat) req.params[key.name] = req.params[key.name].split(key.delimiter);
      }
    });

    return true;
  }

  match(req, settings) {
    if (this._handlesMethod(req.method) &&  this._matchPath(req, settings)) return this;
    return null;
  }
};
