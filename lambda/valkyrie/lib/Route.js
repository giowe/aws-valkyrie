'use strict';

const Utils = require('./Utils');
const pathToRegexp = require('path-to-regexp');

module.exports = class Route {
  constructor(method, path, fn) {
    this.method = method;
    this._path = path;
    this._fn = fn;
    this.parent = null;
    this.stackIndex = null;
    return this;
  }

  get path() {
    if (this.parent) return Utils.joinUrls(this.parent.path, this._path);
    return this._path;
  }

  getFnHandler(req, res) {
    return () => {
      const nextRoute = this.parent.getNextRoute(req, res, this.stackIndex + 1);
      const next = nextRoute ? nextRoute.getFnHandler(req, res) : function(){ res.send() };
      this._fn(req, res, next);
    };
  }

  mount(parent) {
    this.parent = parent;
    this.stackIndex = parent.stack.length;
    parent.stack.push(this);
    return this
  }

  _matchHttpMethod(req) {
    const routeMethod = this.method;
    const reqMethod = req.method;
    return !(
      (typeof routeMethod === 'string' &&
      routeMethod !== 'ALL' &&
      reqMethod !== routeMethod) ||

      (Array.isArray(routeMethod) &&
      routeMethod.indexOf(reqMethod) === -1 &&
      routeMethod.indexOf('ALL') === -1)
    );
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
