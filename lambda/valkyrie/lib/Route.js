'use strict';

const availableMethods = require('methods');
const pathToRegexp = require('path-to-regexp');
const Layer = require('./Layer');

const { flatten } = require('./Utils');

class Route {
  constructor(router, methods, path, fns) {
    this.router = router;
    this.routeIndex = router.routesCount;
    this.methods = methods;
    this.path = path;
    this.layersCount = 0;
    this.layers = [...flatten(fns).map(fn => {
      const layer = new Layer(this, methods, fn);
      this.layersCount++;
      return layer;
    })];

    ['all', ...availableMethods].forEach(method => {
      this[method] = (fn) => _registerLayer(this, { [method]: true }, fn);
    });
  }

  handleRequest(req, res, mountPath, layerStartIndex = 0) {
    const { layers, layersCount } = this;
    if (layerStartIndex >= layers.length) return false;
    if (!_matchMethod(this, req)) return false;

    const fullPath = _urlJoin(mountPath, this.path);
    const matchPath = _matchPath(this, req, fullPath);
    for (let layerIndex = layerStartIndex; layerIndex < layersCount; layerIndex++) {
      const layer = layers[layerIndex];
      //console.log('---LAYER', layerIndex, req.method, fullPath, matchPath ? 'MATCH!' : 'NO MATCH', 'containsRouter?', layer.containsRouter);
      if (layer.containsRouter && layer.handleRequest(req, res, fullPath)) return true;
      else if (matchPath) return layer.handleRequest(req, res, mountPath);
    }
    return false;
  }

  //todo va ripensato in funzione dei Layers.
  describe(mountPath = '') {
    const fullPath = _urlJoin(mountPath, this.path);
    let described = false;
    this.layers.forEach(layer => {
      if (layer.isRouter) layer.describe(fullPath);
      else if (!described) {
        // eslint-disable-next-line no-console
        console.log(Object.keys(this.methods).join(', '), fullPath);
        described = true;
      }
    });
  }
}

module.exports = Route;

function _urlJoin(...paths) {
  return paths.reduce((acc, path) => {
    if (!path) return acc;
    if (path[0] === '/') path = path.substr(1);
    return `${acc}${(!acc && path === '*') || [acc[acc.length-1], path[0]].includes('/')? '' : '/'}${path}`;
  }, '');
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
  } else {
    //todo check it
    console.log('>>>>>>>> REGEX LOADED FROM CACHE');
  }
  return _regexCache[key];
}

function _matchPath(self, req, path) {
  if (path === '*') return true;
  const { methods, router: { settings } } = self;
  const [regex, keys] = _getPathRegex(path, settings);
  const m = regex.exec(!methods.use ? req.path : req.path.substr(0, req.path.split('/', path.replace(/\/$/).split('/').length).join('/').length));
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

function _registerLayer(self, methods, fn) {
  const layer = new Layer(self, methods, fn);
  Object.assign(self.methods, methods);
  self.layers.push(layer);
  self.layersCount++;
  return layer;
}
