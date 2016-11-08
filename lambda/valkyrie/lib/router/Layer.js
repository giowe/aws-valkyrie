'use strict';

module.exports = class Layer {
  constructor(method, fn) {
    this.method = method;
    this.handle = fn;
    this.name = fn.name;
  }

  match(req) {
    const method = this.method;
    return (method === req.method || method === 'all')
  }

  handle_request(req, res, next) {
    const fn = this.handle;

    // not a standard request handler
    if (fn.length > 3) return next();

    try {
      fn(req, res, next);
    } catch (err) {
      next(err);
    }
  }

  handle_error(error, req, res, next) {
    const fn = this.handle;

    // not a standard error handler
    if (fn.length !== 4) return next(error);

    try {
      fn(error, req, res, next);
    } catch (err) {
      next(err);
    }
  }
};
