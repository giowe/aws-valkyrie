'use strict';

const supportedMethods = require('./methods');
const pathToRegexp     = require('path-to-regexp');
const Utils            = require('./Utils');

supportedMethods.push('all');
module.exports = class Route {
  constructor(basePath) {
    this.basePath = basePath;
    this._parent = null;
    this._routeIndex = null;
    this._fnStack = [];

    Utils.forEach(supportedMethods, method => {
      this[method] = (fns) => this.addFnHandles(method, fns);
    });

    return this;
  }

  get started() {
    if (this._parent) return this._parent.started;
    return false;
  }

  get path() {
    if (this._parent) return Utils.joinUrls(this._parent.path, this.basePath);
    return this.basePath;
  }

  getNextFnHandle(req, res, stackStartIndex) {
    return (arg) => {
      if (typeof stackStartIndex === 'undefined') stackStartIndex = 0;

      let fn;
      let next;

      const l = this._fnStack.length;
      if (stackStartIndex < l && arg !=='route') {
        for (let i = stackStartIndex; i < l; i++) {
          const currentFnStackElement = this._fnStack[i];
          if (currentFnStackElement.method === req.method || currentFnStackElement.method === ('all')) {
            fn = currentFnStackElement.fnHandle;
            break;
          }
          stackStartIndex++;
        }

        next = this.getNextFnHandle(req, res, stackStartIndex + 1);

      } else {
        fn = this._parent.getNextRoute(req, res, this._routeIndex + 1).getNextFnHandle(req, res);
      }

      if (!next) {
        next = this._parent.getNextRoute(req, res, this._routeIndex + 1).getNextFnHandle(req, res);
      }

      try {
        fn(req, res, next);
      } catch(err) {
        res.status(500).send(err.stack);
      }
    };
  }

  addFnHandles(method, fns) {
    if (this.started) return this;

    if (Array.isArray(fns)) {
      Utils.forEach(Utils.flatten(fns), fn => {
        this._fnStack.push({
          method: method,
          fnHandle: fn
        });
      });
    } else {
      this._fnStack.push({
        method: method,
        fnHandle: fns
      })
    }
    return this;
  }

  mount(parent) {
    this._parent = parent;
    this._routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this
  }

  matchPath(req, settings) {
    const path = this.path;
    if (this.path === '*') return this;

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

    return this;
  }
};
