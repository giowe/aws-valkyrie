'use strict';

const availableMethods = require('methods');
const Route = require('./Route');
const { flatten } = require('./Utils');

class Router {
  constructor(settings) {
    this.settings = Object.assign({
      sensitive: false, //When true the path will be case sensitive
      strict: false,    //When false the trailing slash is optional
      end: true,        //When false the path will match at the beginning
      delimiter: '/'    //Set the default delimiter for repeat parameters
    }, settings);
    this.containerLayer = null;
    this.routes = [];
    this.routesCount = 0;

    ['all', ...availableMethods].forEach(method => {
      this[method] = (...args) => _registerRoute(this, _parseArgs({ [method]: true }, ...args));
    });
  }

  get isRouter() {
    return true;
  }

  use(...args) {
    const parsedArgs = _parseArgs({ use: true }, ...args);
    if (!parsedArgs.paths.length) parsedArgs.paths.push('/');
    return _registerRoute(this, parsedArgs);
  }

  route(paths) {
    return _registerRoute(this, _parseArgs({}, paths));
  }

  handleRequest(req, res, mountPath = '', routeStartIndex = 0) {
    const { routes, routesCount, containerLayer } = this;
    for (let routeIndex = routeStartIndex; routeIndex < routesCount; routeIndex++) {
      //console.log('ROUTE', routeIndex, routes[routeIndex].paths);
      if (routes[routeIndex].handleRequest(req, res, mountPath)) return true;
    }

    if (!containerLayer) {
      console.log('sono nel layer finale anche se deve aver risposto il catchall');
      res.header('content-type', 'text/html');
      res.status(404).send(`<meta charset="utf-8"><title>Error</title><pre>Cannot ${req.method.toUpperCase()} ${req.path}</pre>`);
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

function _parseArgs(...args) {
  const methods = args.shift();
  let paths = [];
  if (typeof args[0] === 'string') paths = [args.shift()];
  else if (Array.isArray(args[0])) {
    args[0] = flatten(args[0]);
    if (args[0][0].length && typeof args[0][0] !== 'function') paths = args.shift();
  }
  const fns = flatten(args);
  return { methods, paths, fns };
}

function _registerRoute(self, { methods, paths, fns }) {
  const route = new Route(self, methods, paths, fns);
  self.routes.push(route);
  self.routesCount++;
  return route;
}

module.exports = Router;
