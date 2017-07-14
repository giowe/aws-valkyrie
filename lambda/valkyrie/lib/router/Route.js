'use strict';

const urlJoin = require('url-join');

class Route {
  constructor(router, methods, path, layers, settings) {
    //todo se il router non mi serve lo levo e sarebbe bello non servisse.
    this.router = router;
    this.stackIndex = router.stackCount;
    this.methods = methods;
    this.path = path;
    this.layers = layers;
    this.middlewares = [];
    this.routers = [];
    this.settings = settings;
    layers.forEach(layer => layer.isRouter ? this.routers.push(layer) : this.middlewares.push(layer));
    return this;
  }

  handlesMethod(method) {
    const { methods } = this;
    if (methods.all) return true;
    if (method === 'head' && !methods.head) method = 'get';
    return methods[method];
  }

  handleRequest(req, res, mountPath, stackIndex) {
    const { layers, middlewares, routers } = this;
    if (!this.handlesMethod(req.method)) {
      console.log('can`t handle request');
      return false;
    }

    console.log('i can handle it!', this.path);
    return true;
  }

  describe(mountPath = '') {
    const fullPath = mountPath ? urlJoin(mountPath, this.path) : this.path;
    if (this.middlewares.length) console.log(Object.keys(this.methods).join(', '), fullPath);
    this.routers.forEach(router => router.describe(fullPath));
  }
}

module.exports = Route;
