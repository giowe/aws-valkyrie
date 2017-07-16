'use strict';

const availableMethods = require('methods');
const Route = require('./Route');

class Router {
  constructor(settings) {
    this.settings = Object.assign({
      sensitive: false, //When true the path will be case sensitive
      strict: false,    //When false the trailing slash is optional
      end: true,        //When false the path will match at the beginning
      delimiter: '/'    //Set the default delimiter for repeat parameters
    }, settings);
    this.routes = [];
    this.routesCount = 0;

    ['all', ...availableMethods].forEach(method => {
      this[method] = (...args) => _registerRoute(this, { [method]: true }, ...args);
    });
  }

  get isRouter() {
    return true;
  }

  use(...args) {
    return _registerRoute(this, { use: true }, ...args);
  }

  route(path) {
    return _registerRoute(this, {}, path);
  }

  handleRequest(req, res, mountPath = '', routeStartIndex = 0) {
    const { routes, routesCount } = this;
    for (let routeIndex = routeStartIndex; routeIndex < routesCount; routeIndex++) {
      //console.log('ROUTE', routeIndex, routes[routeIndex].path);
      if (routes[routeIndex].handleRequest(req, res, mountPath)) return true;
    }
    return false;
  }

  describe(options, mountPath = '', level = 0) {
    const { format } = Object.assign({ format: 'console' }, options);

    let string;
    if (['html', 'string', 'console'].includes(format)) {
      string = this.routes.reduce((acc, route) => `${acc}${route.describe({ format: 'string' }, mountPath, level)}${route.routeIndex < route.router.routesCount - 1 ? '\n' : ''}`,
        `${level === 0 ? ' ' : ' │'}${' '.repeat(-1 + (level + 1) + level * 2)}├Router \n`
      );
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

function _registerRoute(self, methods = {}, ...args) {
  const path = typeof args[0] === 'string' ? args.shift() : '*';
  const route = new Route(
    self,
    methods,
    path,
    args
  );
  self.routes.push(route);
  self.routesCount++;
  return route;
}

module.exports = Router;
