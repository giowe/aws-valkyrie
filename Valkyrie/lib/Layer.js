'use strict';

class Layer {
  constructor(route, methods, fn) {
    this.router = route.router;
    this.route = route;
    this.layerIndex = route.layersCount;
    this.methods = methods;
    this._fn = fn;

    if (this.containsRouter) this._fn.containerLayer = this;
  }

  get containsRouter() {
    return this._fn.isRouter === true;
  }

  handleRequest(req, res, paths) {
    const { route, router, layerIndex } = this;
    if (!_matchMethod(this, req)) return route.handleRequest(req, res, paths, layerIndex + 1);
    const { _fn } = this;
    if (this.containsRouter) return _fn.handleRequest(req, res, paths);
    try {
      _fn(req, res, (err) => {
        if (err && err !== 'route') throw err;
        else if (err === 'route' || !route.handleRequest(req, res, paths, layerIndex + 1)) {
          if (!router.handleRequest(req, res, paths, route.routeIndex + 1)) {
            const { containerLayer } = router;
            if (containerLayer && !containerLayer.route.handleRequest(req, res, paths, containerLayer.layerIndex +1)) {
              containerLayer.router.handleRequest(req, res, paths, containerLayer.route.routeIndex +1);
            }
          }
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
      if (!res.headersSent) res.status(500).send(`<meta charset="utf-8"><title>Error</title><pre>${err.stack}</pre>`);
    }
    return true;
  }

  describe(options, paths = this.route.paths, level = 0) {
    const { format } = Object.assign({ format: 'console' }, options);
    let string;
    if (['html', 'string', 'console'].includes(format)) {
      const lastLayer = this.layerIndex === this.route.layersCount - 1;
      const lastRoute = this.route.routeIndex === this.route.router.routesCount -1;
      const prefix = ` ${lastRoute && lastLayer && level === 0 ? ' ' : '│'}${' '.repeat(-1 + (level + 1) * 2 + level * 2)}${lastLayer ? '└' : '├'}`;
      const keys = Object.keys(this.methods).join(', ');
      if (this.containsRouter) {
        string = `${prefix}─┬Layer: ${keys}\n${this._fn.describe({ format: 'string' }, paths, level + 1)}`;
      }
      else string = `${prefix}──Layer: ${keys}`;
    }

    switch (format) {
      case 'html':
        return `</code>${string.replace(/\n/g, '</br>').replace(/ /g, '&nbsp;')}</code>`;
      case 'string':
        return string;
      case 'console':
        // eslint-disable-next-line no-console
        return console.log(string);
      case 'json':
        return { todo: 'todo' }; //todo
      default:
        throw new Error(`${format} is not a supported format; chose between "console", "string", "html" and "json"`);
    }
  }
}

function _matchMethod(self, req) {
  const { methods, route } = self;
  if (methods.use || methods.all) return true;
  let { method } = req;
  if (method === 'head' && !methods.head && !route.methods.head) method = 'get';
  return methods[method];
}

module.exports = Layer;
