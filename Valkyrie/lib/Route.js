'use strict';

const availableMethods = require('methods');
const pathToRegexp = require('path-to-regexp');
const Layer = require('./Layer');
const { flatten } = require('./Utils');

class Route {
  constructor(router, methods, paths, fns) {
    this.router = router;
    this.routeIndex = router.routesCount;
    this.methods = methods;
    this.paths = paths;
    this.layersCount = 0;
    this.layers = [...fns.map(fn => {
      const layer = new Layer(this, methods, fn);
      this.layersCount++;
      return layer;
    })];

    ['all', ...availableMethods].forEach(method => {
      this[method] = (fn) => _registerLayer(this, { [method]: true }, fn);
    });
  }

  handleRequest(req, res, mountPath, layerIndex = 0, err = null) {
    const { layers, layersCount, paths, router, routeIndex } = this;
    if (layerIndex < layersCount && _matchMethod(this, req)) {
      const { fullPath, matchPath } = _getFullMatchingPath(this, req, mountPath, paths);
      const layer = layers[layerIndex];
     // console.log('---LAYER', layerIndex, req.method, fullPath, matchPath ? 'MATCH!' : 'NO MATCH', 'containsRouter?', layer.containsRouter);
      if (layer.containsRouter) return layer.handleRequest(req, res, fullPath, err);
      else if (matchPath) return layer.handleRequest(req, res, mountPath, err);
    }
    router.handleRequest(req, res, mountPath, routeIndex + 1, err);
  }

  describe(mountPath = '', level = 0) {
    const fullPaths = this.paths.map(path => _urlJoin(mountPath, path));
    return this.layers.reduce((acc, layer) => `${acc}\n${layer.describe(fullPaths, level)}`, `${' '.repeat(1 + (level * 2))}Route ${fullPaths.join(', ')}`);
  }
}

module.exports = Route;

function _urlJoin(...paths) {
  return flatten(paths).reduce((acc, path) => {
    if (!path) return acc;
    if (path[0] === '/') path = path.substr(1);
    return `${acc}${(!acc && path === '*') || [acc[acc.length-1], path[0]].includes('/')? '' : '/'}${path}`;
  }, '');
}

function _matchMethod(self, req) {
  const { methods } = self;
  if (methods.use || methods.all) return true;
  let { method } = req;
  if (method === 'head' && !methods.head) method = 'get';
  return methods[method];
}

function _getFullMatchingPath(self, req, mountPath, paths) {
  const l = paths.length;
  for (let i = 0; i < l; i ++) {
    const fullPath = _urlJoin(mountPath, paths[i]);
    const matchPath = _matchPath(self, req, fullPath);
    if (matchPath) return { fullPath, matchPath };
  }
  return { fullPath: null, matchPath: false };
}

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

function _matchPath(self, req, path) {
  if (path === '*') return true;
  const [regex, keys] = _getPathRegex(path, self.router.settings);
  const m = regex.exec(!self.methods.use ? req.path : req.path.substr(0, req.path.split('/', path.replace(/\/$/).split('/').length).join('/').length));
  if (!m) return false;
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

function _registerLayer(self, methods, fn) {
  const layer = new Layer(self, methods, fn);
  Object.assign(self.methods, methods);
  self.layers.push(layer);
  self.layersCount++;
  return self;
}
