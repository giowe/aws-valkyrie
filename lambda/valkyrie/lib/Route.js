'use strict';

const supportedMethods = require('./methods');
const pathToRegexp = require('path-to-regexp');
const Utils        = require('./Utils');

supportedMethods.push('all');
module.exports = class Route {
  constructor(basePath, methods, fnHandlers) {
    this.basePath = basePath;
    this._parent = null;
    this._routeIndex = null;
    this._fnStack = [];
    this._fnStackIndex = 0;

    if (methods && fnHandlers) this.addFnHandlers(methods, fnHandlers);

    Utils.forEach(supportedMethods, method => {
      this[method] = (fns) => this.addFnHandlers(method, fns);
    });

    return this;
  }

  get path() {
    if (this._parent) return Utils.joinUrls(this._parent.path, this.basePath);
    return this.basePath;
  }

  getNextFnHandler(req, res) {
    return () => {
      const fn = this._fnStack[this._fnStackIndex].fnHandler;
      this._fnStackIndex++;
      let next;
      if (this._fnStackIndex < this._fnStack.length){
        next = this.getNextFnHandler(req, res);
      } else {
        const nextRoute = this._parent.getNextRoute(req, res, this._routeIndex + 1);
        next = nextRoute ? nextRoute.getNextFnHandler(req, res) : function(){ res.send() };
      }

      fn(req, res, next);
    };
  }

  addFnHandlers(methods, fns) {
    if (!Array.isArray(methods)) methods = [methods];
    if (Array.isArray(fns)) {
      Utils.forEach(Utils.flatten(fns), fn => {
        this._fnStack.push({
          methods: methods,
          fnHandler: fn
        });
      });
    } else {
      this._fnStack.push({
        methods: methods,
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

  _matchMethods(req) {
    const l = this._fnStack.length;
    for (let i = this._fnStackIndex; i < l; i++) {
      const currentFnStackElement = this._fnStack[i];
      const currentFnMethods = currentFnStackElement.methods;
      const match = typeof currentFnMethods.indexOf(req.method) !== -1 || currentFnMethods.indexOf('all') !== -1;
      if (match) return currentFnStackElement.fnHandler;
      this._fnStackIndex++;
    }
    return null;
  }

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

  matchRequest (req, settings) {
    if (this._matchPath(req, settings) && this._matchMethods(req)) return this;
    return null;
  };
};
