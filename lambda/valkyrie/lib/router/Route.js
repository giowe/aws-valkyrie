'use strict';

const urlJoin = require('url-join');
const pathToRegexp = require('path-to-regexp');

class Route {
  constructor(router, methods, path, layers, settings) {
    this.router = router;
    this.routeIndex = router.stackCount;
    this.methods = methods;
    this.path = path;
    this.layers = layers;
    this.middlewares = [];
    this.routers = [];
    this.settings = settings;
    layers.forEach(layer => layer.isRouter ? this.routers.push(layer) : this.middlewares.push(layer));
    return this;
  }

  handleRequest(req, res, mountPath, layerStartIndex = 0) {
    const { layers, middlewares, routers, router } = this;
    if (layerStartIndex >= layers.length) return false;
    if (!_matchMethod(this, req)) {
      console.log('can`t handle request');
      return false;
    }

    const fullPath = _getFullPath(mountPath, this.path);
    const matchPath = _matchPath(this, req, fullPath);
    const l = layers.length;
    for (let layerIndex = layerStartIndex; layerIndex < l; layerIndex++) {
      console.log('---LAYER', layerIndex, req.method, fullPath, matchPath ? 'MATCH!' : 'NO MATCH');
      const layer = layers[layerIndex];
      if (layer.isRouter) {
        console.log('got router');
        if (layer.handleRequest(req, res, mountPath)) return true;
      } else if (matchPath) {
        try {
          layer(req, res, () => {
            console.log('next called');
            if (!this.handleRequest(req, res, mountPath, layerIndex + 1)) {
              console.log('no more layers here, going to next route (', this.routeIndex + 1, ')');
              router.handleRequest(req, res, mountPath, this.routeIndex + 1);
            }
          });
        } catch (err) {
          //todo get error handling middleware.
          res.status(500).send(`${err.toString()}`);
        }
        return true;
      }
    }

    return false;
  }

  describe(mountPath = '') {
    const fullPath = _getFullPath(mountPath, this.path);
    if (this.middlewares.length) console.log(Object.keys(this.methods).join(', '), fullPath);
    this.routers.forEach(router => router.describe(fullPath));
  }
}

module.exports = Route;

function _getFullPath(mountPath, path) {
  return mountPath ? urlJoin(mountPath, path) : path;
}

function _matchMethod(self, req) {
  const { methods } = self;
  if (methods.all) return true;
  let { method } = req;
  if (method === 'head' && !methods.head) method = 'get';
  return methods[method];
}

function _matchPath(self, req, path) {
  const { settings } = self;
  if (path === '*') return true;

  const keys = [];
  const re = pathToRegexp(path, keys, settings);
  const m = re.exec(req.path);
  if (!m) return false;

  req.params = req.params || {};
  keys.forEach((key, i) => {
    const param = m[i + 1];
    if (param){
      req.params[key.name] = _decodeURIParam(param);
      if (key.repeat) req.params[key.name] = req.params[key.name].split(key.delimiter);
    }
  });

  return true;
}

function _decodeURIParam(param) {
  try {
    return decodeURIComponent(param);
  }
  catch (err) {
    return err.toString();
  }
}
