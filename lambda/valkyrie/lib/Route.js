'use strict';

const defaultMethods = require('./methods');
const pathToRegexp   = require('path-to-regexp');
const Utils          = require('./Utils');

module.exports = class Route {
  constructor(methods, basePath, fnsContainer) {
    this.methods = methods || [];
    this.basePath = basePath;
    this._fnsContainer = fnsContainer || {};
    this.parent = null;
    this.stackIndex = null;

    Utils.forEach(defaultMethods, method => {
      this[method] = (fn) => {
        if (!this._fnsContainer[method]) this.methods.push(method);
        this._fnsContainer[method] = fn;
        return this;
      };
    });

    return this;
  }

  get path() {
    if (this.parent) return Utils.joinUrls(this.parent.path, this.basePath);
    return this.basePath;
  }

  getFnHandler(req, res) {
    return () => {
      const nextRoute = this.parent.getNextRoute(req, res, this.stackIndex + 1);
      const next = nextRoute ? nextRoute.getFnHandler(req, res) : function(){ res.send() };
      const fn = this._fnsContainer[req.method] || this._fnsContainer['all'];
      fn(req, res, next);
    };
  }

  mount(parent) {
    this.parent = parent;
    this.stackIndex = parent.stack.length;
    parent.stack.push(this);
    return this
  }

  _matchHttpMethod(req) {
    const routeMethods = this.methods;
    return ( routeMethods.indexOf(req.method) !== -1 || routeMethods.indexOf('all') !== -1);
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
    if (this._matchHttpMethod(req) && this._matchPath(req, settings)) return this;
    return null;
  };
};
