'use strict';

class Route {
  constructor(router, method, path, layers, settings) {
    this.router = router;
    this.stackIndex = router.stackCount;
    this.method = method;
    this.path = path;
    this.layers = layers;
    this.settings = settings;
    return this;
  }

  handleRequest(req, res) {
    const { method } = this;
    //todo da gestire il metodo head come se fosse un get.
    //if (method === 'head' && !this._methods['head']) method = 'get';
    if (method !== 'all' && !(req.method === method)) {
      console.log('can`t resolve request');
      return false;
    }
    console.log('i can handle it!', this.method, this.path);
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
}

module.exports = Route;
