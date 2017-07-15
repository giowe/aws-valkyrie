'use strict';

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
    const { layers, methods, settings } = this;
    if (layerStartIndex >= layers.length) return false;
    if (!_matchMethod(this, req)) {
      //console.log('can`t handle request');
      return false;
    }

    const fullPath = _getFullPath(this, mountPath, this.path);
    let path2Match;
    if (methods.use) {
      console.log(fullPath);
      path2Match = `${fullPath}*`;
    } else {
      path2Match = fullPath;
    }

    const matchPath = _matchPath(req, path2Match, settings);
    const l = layers.length;
    for (let layerIndex = layerStartIndex; layerIndex < l; layerIndex++) {
      //console.log('---LAYER', layerIndex, req.method, fullPath, matchPath ? 'MATCH!' : 'NO MATCH');
      const layer = layers[layerIndex];
      if (layer.isRouter) {
        if (layer.handleRequest(req, res, fullPath)) return true;
      } else if (matchPath) {
        try {
          layer(req, res, () => {
            if (!this.handleRequest(req, res, mountPath, layerIndex + 1)) {
              this.router.handleRequest(req, res, mountPath, this.routeIndex + 1);
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
    const fullPath = _getFullPath(this, mountPath, this.path);
    if (this.middlewares.length) console.log(Object.keys(this.methods).join(', '), fullPath);
    this.routers.forEach(router => router.describe(fullPath));
  }
}

module.exports = Route;

function _getFullPath(self, ...paths) {
  const { delimiter } = self.settings;
  return paths.reduce((acc, path) => {
    if (!path) return acc;
    return `${acc}${!acc || [acc[acc.length-1], path[0]].includes(delimiter)? '' : delimiter}${path}`;
  }, '');
  //return mountPath ? urlJoin(mountPath, path) : path;
}

function _matchMethod(self, req) {
  const { methods } = self;
  if (methods.all || methods.use) return true;
  let { method } = req;
  if (method === 'head' && !methods.head) method = 'get';
  return methods[method];
}

//todo test if it works properly
const _regexCache = {};
function _getPathRegex(path, settings) {
  const key = `${JSON.stringify(settings)}${path}`;
  if (!_regexCache[key]) {
    const keys = [];
    _regexCache[key] = [
      pathToRegexp(path, keys, settings),
      keys
    ];
  }
  return _regexCache[key];
}

function _matchPath(req, path, settings) {
  if (path === '*') return true;

  const [regex, keys] = _getPathRegex(path, settings);
  const m = regex.exec(req.path);
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
