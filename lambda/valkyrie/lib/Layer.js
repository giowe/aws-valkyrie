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

  describe(options, path = this.route.path, level = 0) {
    const { format } = Object.assign({ format: 'console' }, options);
    let string;
    if (['html', 'string', 'console'].includes(format)) {
      const lastLayer = this.layerIndex === this.route.layersCount - 1;
      const lastRoute = this.route.routeIndex === this.route.router.routesCount -1;
      const prefix = ` ${lastRoute && lastLayer && level === 0 ? ' ' : '│'}${' '.repeat(-1 + (level + 1) * 2 + level * 2)}${lastLayer ? '└' : '├'}`;
      const keys = Object.keys(this.methods).join(', ');
      if (this.containsRouter) {
        string = `${prefix}─┬Layer: ${keys}\n${this._fn.describe({ format: 'string' }, path, level + 1)}`;
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

module.exports = Layer;
