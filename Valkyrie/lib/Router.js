'use strict';

const availableMethods = require('methods');
const Route = require('./Route');
const { flatten } = require('./Utils');

class Router {
  constructor(settings) {
    this.settings = Object.assign({
      useContext: true,
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

  handleRequest(req, res, mountPath = [], routeIndex = 0, err = null) {
    const { routes, routesCount } = this;
    console.log(routeIndex, routesCount);
    if (routeIndex < routesCount) {
      console.log('ROUTE', routeIndex, routes[routeIndex].paths);
      routes[routeIndex].handleRequest(req, res, mountPath, 0, err);
      return;
    }
    const { containerLayer } = this;
    if (containerLayer) {
      mountPath.pop();
      console.log(containerLayer.describe(),  containerLayer.route.routeIndex + 1);
      containerLayer.router.handleRequest(req, res, mountPath, containerLayer.route.routeIndex + 1, err);
      return;
    }
    res.header('content-type', 'text/html');
    if (!err) res.status(404).send(_htmlTemplate('Error', `<pre>Cannot ${req.method.toUpperCase()} ${req.path}</pre>`));
    else res.status(500).send(_htmlTemplate('Error', `<pre>${err.stack}</pre>`));
  }

  describe(mountPath = '', level = 0) {
    return this.routes.reduce((acc, route) => `${acc}${route.describe(mountPath, level)}${route.routeIndex < route.router.routesCount - 1 ? '\n' : ''}`, '');
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

function _htmlTemplate(title, body){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

module.exports = Router;
