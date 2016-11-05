'use strict';

const methods      = require('./methods');
const pathToRegexp = require('path-to-regexp');
const Utils        = require('./Utils');

methods.push('all');
module.exports = class Route {
  constructor(basePath, fnHandlers) {
    this.basePath = basePath;
    this.fnHandlers = fnHandlers || {};
    this.parent = null;
    this.routeIndex = null;

    methods.push('all');
    Utils.forEach(methods, method => {
      this[method] = (fn) => {
        this.fnHandlers[method] = fn;
        return this;
      };
    });

    return this;
  }

  get path() {
    if (this.parent) return Utils.joinUrls(this.parent.path, this.basePath);
    return this.basePath;
  }

  get methods() {
    return Object.keys(this.fnHandlers);
  }

  getFnHandler(req, res) {
    return () => {
      const nextRoute = this.parent.getNextRoute(req, res, this.routeIndex + 1);
      const next = nextRoute ? nextRoute.getFnHandler(req, res) : function(){ res.send() };
      const fn = this.fnHandlers[req.method] || this.fnHandlers['all'];
      fn(req, res, next);
    };
  }

  mount(parent) {
    this.parent = parent;
    this.routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this
  }

  _matchMethod(req) {
    return ( typeof this.fnHandlers[req.method] === 'function' || typeof this.fnHandlers['all'] === 'function');
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
