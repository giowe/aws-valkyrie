'use strict';

class Layer {
  constructor(route, methods, fn) {
    this.router = route.router;
    this.route = route;
    this.layerIndex = route.layersCount;
    this.methods = methods;
    this._fn = fn;
  }

  get containsRouter() {
    return this._fn.isRouter === true;
  }

  handleRequest(req, res, path) {
    //todo I have to match method!
    const { _fn } = this;
    if (this.containsRouter) return _fn.handleRequest(req, res, path);
    try {
      _fn(req, res, (err) => {
        if (err && err !== 'route') throw err;
        else if (err === 'route' || !this.route.handleRequest(req, res, path, this.layerIndex + 1)) {
          this.router.handleRequest(req, res, path, this.route.routeIndex + 1);
        }
      });
    } catch (err) {
      //todo get error handling middleware.
      res.status(500).send(`${err.toString()}`);
    }
    return true;
  }

  describe(mountPath = '') {}
}

module.exports = Layer;
