'use strict';

const supportedMethods = require('./methods');
const pathToRegexp     = require('path-to-regexp');
const Utils            = require('./Utils');

supportedMethods.push('all');
module.exports = class Route {
  constructor(basePath, method, fnHandlers) {
    this.basePath = basePath;
    this._parent = null;
    this._routeIndex = null;
    this._fnStack = [];
    this._fnStackIndex = 0;

    if (method && fnHandlers) this.addFnHandlers(method, fnHandlers);

    Utils.forEach(supportedMethods, method => {
      this[method] = (fns) => this.addFnHandlers(method, fns);
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

  getNextFnHandler(req, res, fromIndex) {
    return (arg) => {
      if (typeof fromIndex === 'undefined') fromIndex = 0;

      let fn;

      const l = this._fnStack.length;
      if (fromIndex < l) {
        for (let i = fromIndex; i < l; i++) {
          const currentFnStackElement = this._fnStack[i];
          if (currentFnStackElement.method !== req.method || currentFnStackElement.method !== ('all')) {
            fn = currentFnStackElement.fnHandler;
            break;
          }
          fromIndex++;
        }
      } else {
        const nextRoute = this._parent.getNextRoute(req, res, this._routeIndex + 1);
        fn = nextRoute ? nextRoute.getNextFnHandler(req, res) : function(){ res.send() };
      }
     // console.log(this.path, fromIndex,'/', this._fnStack.length);

      let next;

      if (arg !=='route' && fromIndex < this._fnStack.length){
        next = this.getNextFnHandler(req, res, fromIndex + 1);
      }

      if(!next) {
        const nextRoute = this._parent.getNextRoute(req, res, this._routeIndex + 1);
        next = nextRoute ? nextRoute.getNextFnHandler(req, res) : function(){ res.send() };
      }

      fn(req, res, next);
    };
  }

  addFnHandlers(method, fns) {
    if (this.started) return this;

    if (Array.isArray(fns)) {
      Utils.forEach(Utils.flatten(fns), fn => {
        this._fnStack.push({
          method: method,
          fnHandler: fn
        });
      });
    } else {
      this._fnStack.push({
        method: method,
        fnHandler: fns
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

  _getNextMatchingFnHandler(req, fnStackIndex) {
    const l = this._fnStack.length;
    for (let i = fnStackIndex; i < l; i++) {
      const currentFnStackElement = this._fnStack[i];
      const currentFnMethod = currentFnStackElement.method;
      const match = currentFnMethod !== req.method || currentFnMethod !== ('all');
      if (match) return currentFnStackElement.fnHandler;
      this._fnStackIndex++;
    }
    return null;
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
