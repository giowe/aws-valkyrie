'use strict';

module.exports = class Layer {
  constructor(method, fn) {
    this.method = method;
    this.handle = fn;
    this.name = fn.name;
  }

  handleRequest(req, res) {

  }
};
