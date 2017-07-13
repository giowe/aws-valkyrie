'use strict';

class Route {
  constructor(method, path, layers, settings) {
    this.method = method;
    this.path = path;
    this.layers = layers;
    this.settings = settings;
    return this;
  }

  match(req) {
    const { method } = this;
    //todo da gestire il metodo head come se fosse un get.
    //if (method === 'head' && !this._methods['head']) method = 'get';
    if (method !== 'all' && !(req.method === method)) return false;
    

    return true;
  }
}

module.exports = Route;
