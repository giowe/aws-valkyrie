'use strict';

const Utils = require('./utils');
const pathToRegexp = require('path-to-regexp');

module.exports = class Middleware {
  constructor(httpMethod, path, fn) {
    this.httpMethod = httpMethod;
    this._path = path;
    this.fn = fn;
    this.parent = null;
    this.stackIndex = null;
    return this;
  }

  get path() {
    if (this.parent) return Utils.joinUrls(this.parent.prefix, this._path);
    return this._path;
  }

  fnWrapper(req, res) {
    return () => {
      const nextMiddleware = this.parent.getNextMiddleware(req, res, this.stackIndex + 1);
      const next = nextMiddleware ? nextMiddleware.fnWrapper(req, res) : function() { /*res.status(500).send('next is not a function')*/};
      this.fn(req, res, next);
    };
  }

  addToStack(parent) {
    this.parent = parent;
    this.stackIndex = parent.stack.length;
    parent.stack.push(this);
    return this
  }

  matchRequest (req, settings) {
    const midPath = this.path;
    if (this.httpMethod !== 'ALL' && req.httpMethod !== this.httpMethod) return null;
    if (midPath === '*') return this;

    const keys = [];
    const re = pathToRegexp(midPath, keys, settings);
    const m = re.exec(req.path);
    if (!m) return null;

    req.params = req.params || {};
    Utils.forEach(keys, (key, i) => {
      const param = m[i + 1];
      if (param){
        req.params[key.name] = Utils.decodeURIParam(param);
        if (key.repeat) req.params[key.name] = req.params[key.name].split(key.delimiter);
      }
    });

    return this;
  };
};
