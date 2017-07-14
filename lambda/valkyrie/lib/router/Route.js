'use strict';

const urlJoin = require('url-join');

class Route {
  constructor(router, method, path, layers, settings) {
    this.router = router;
    this.stackIndex = router.stackCount;
    this.method = method;
    this.path = path;
    this.layers = layers;
    this.middlewares = [];
    this.routers = [];
    this.settings = settings;
    layers.forEach(layer => layer.isRouter ? this.routers.push(layer) : this.middlewares.push(layer));
    return this;
  }

  handleRequest(req, res, prefix, stackIndex) {
    const { method, layers } = this;
    //todo da gestire il metodo head come se fosse un get.
    //if (method === 'head' && !this._methods['head']) method = 'get';
    if (method !== 'all' && !(req.method === method)) {
      console.log('can`t resolve request');
      return false;
    }

    layers.forEach(layer => {
      console.log(layer.constructor.name);
      if (layer.constructor.name === 'Router') {
        return layer.handleRequest(req, res, prefix);
      }
    });

    //console.log('i can handle it!', this.method, this.path);
    return true;
  }

  match(req, prefix = '') {
    const { method } = this;
    //todo da gestire il metodo head come se fosse un get.
    //if (method === 'head' && !this._methods['head']) method = 'get';
    if (method !== 'all' && !(req.method === method)) return false;

    console.log(this.method, this.path);
    return true;
  }

  describe(mountPath = '') {
    const fullPath = mountPath ? urlJoin(mountPath, this.path) : this.path;
    if (this.middlewares.length) console.log(this.method, fullPath);
    this.routers.forEach(router => router.describe(fullPath));
  }
}

module.exports = Route;
