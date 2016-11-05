'use strict';

const supportedMethods = require('./methods');
const pathToRegexp = require('path-to-regexp');
const Utils        = require('./Utils');

supportedMethods.push('all');
module.exports = class Route {
  constructor(basePath, methods, fnHandlers) {
    this.basePath = basePath;
    this.parent = null;
    this.routeIndex = null;
    this.fnStack = [];
    this.fnIndex = 0;

    if (methods && fnHandlers) this.addFnHandlers(methods, fnHandlers);

    Utils.forEach(supportedMethods, method => {
      this[method] = (fns) => {
        //TODO return da provare a levare
        return this.addFnHandlers(method, fns);
      };
    });

    return this;
  }

  get path() {
    if (this.parent) return Utils.joinUrls(this.parent.path, this.basePath);
    return this.basePath;
  }

  get methods() {
    const methods = [];
    Utils.forEach(this.fnStack, fnStackElement => {
      Utils.forEach(fnStackElement.methods, method => {
        if (methods.indexOf(method) === -1) methods.push(method)
      })
    });
    return methods;
  }

  get currentFnStackElement() {
    if (this.fnIndex >= this.fnStack.length) return null;
    return this.fnStack[this.fnIndex];
  }

  getNextStackElement() {
    let nextStackElement = null;
    if (this.fnIndex < this.fnStack.length) {
      nextStackElement = this.fnStack[this.fnIndex];
      this.fnStack ++;
    }
    return nextStackElement;
  }

  getNextFnHandler(req, res) {
    return () => {
      const currentFnStackElement = this.currentFnStackElement;
      const fn = currentFnStackElement.fnHandler;
      let next;
      if (this._matchMethod(req)) {
        next = this.currentFnStackElement.fnHendler;
      } else {
        const nextRoute = this.parent.getNextRoute(req, res, this.routeIndex + 1);
        next = nextRoute ? nextRoute.getNextFnHandler(req, res) : function(){ res.send() };
      }

      fn(req, res, next);
    };
  }

  addFnHandlers(methods, fns) {
    if (!Array.isArray(methods)) methods = [methods];
    if (Array.isArray(fns)) {
      Utils.forEach(Utils.flatten(fns), fn => {
        this.fnStack.push({
          methods: methods,
          fnHandler: fn
        });
      });
    } else {
      this.fnStack.push({
        methods: methods,
        fnHandler: fns
      })
    }
    return this;
  }

  mount(parent) {
    this.parent = parent;
    this.routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this
  }

  _matchMethod(req) {
    while (this.currentFnStackElement) {
      const currentFnMethods = this.currentFnStackElement.methods;
      const match = typeof currentFnMethods.indexOf(req.method) !== -1 || currentFnMethods.indexOf('all') !== -1;
      if (match) return true;
      this.fnIndex++;
    }
    return false;
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
    if (this._matchMethod(req) && this._matchPath(req, settings)) return this;
    return null;
  };
};
