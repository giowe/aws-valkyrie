'use strict';

const methods = require('methods');
const { flatten, joinUrls, repeatText, forEach } = require('./../Utils');
const Route = require('./Route');

let _fakeRoute;
class Router {
  constructor(settings) {
    this.settings = Object.assign({
      sensitive: false, //When true the path will be case sensitive
      strict: false,    //When false the trailing slash is optional
      end: true,        //When false the path will match at the beginning
      delimiter: '/'    //Set the default delimiter for repeat parameters
    });

    this.stack = [];
    this.stackCount = 0;

    Object.assign(this, {
      mountpath: '',
      routeStack: [],
      _routeIndex: null,
      _parent: null
    });

    ['all', ...methods].forEach(method => {
      this[method] = (...args) => _register(this, method, ...args);
    });

    return this;
  }

  //get mountpathx() { return this.mountpaths}
  //set mountpathx(value) {}

  use(...args) {
    _register(this, 'all', ...args);
  }

  route(path) {
    /*if (this.started) {
      if (!_fakeRoute) _fakeRoute = new Route(path);
      return _fakeRoute;
    }
    return new Route(path).mount(this);*/
  }

  handleRequest(req, res,  prefix = '', stackIndex = 0) {
    const { stack, stackCount } = this;
    for (let i = stackIndex; i < stackCount; stackIndex++) {
      if (stack[stackIndex].handleRequest(req, res, prefix, stackIndex)) break;
    }

  /*  if (typeof stackStartIndex === 'undefined') stackStartIndex = 0;

    const l = this.routeStack.length;
    for (let i = stackStartIndex; i < l; i++) {
      const mountable = this.routeStack[i];

      let route;
      switch (mountable.constructor.name) {
        case 'Route':
          route = mountable.match(req, this.settings);
          break;
        case 'Application':
        case 'Router': {
          route = mountable.getNextRoute(req, res);
          break;
        }
      }
      if (route) return route;
    }

    if (this._parent) {
      const route = this._parent.getNextRoute(req, res, this._routeIndex + 1);
      if (route) return route;
    }

    return new Route('*').all( (req, res) => { res.status(500).send('no route found.') } );*/
  }

  /**
   * Debug function
   * @param level
   */
  describe(level) {

  }
}

function _register(self, method, ...args) {
  const { stack, settings } = self;
  const path = typeof args[0] === 'string' ? args.shift() : '*';
  stack.push(new Route(self, method, path, flatten(args), settings));
  self.stackCount++;
}

module.exports = Router;
