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

  get path() {
    if (!this._parent) return this.mountpath;
    else return joinUrls(this._parent.path, this.mountpath);
  }

  _mount(mountpath, parent){
    this.mountpath = mountpath;
    this._parent = parent;
    this._routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this;
  }

  route(path) {
    /*if (this.started) {
      if (!_fakeRoute) _fakeRoute = new Route(path);
      return _fakeRoute;
    }
    return new Route(path).mount(this);*/
  }


  //todo sparisce
  getNextRoute(req, res, stackStartIndex){
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
    console.log(this.stack);

    if (typeof level !== 'number') level = 0;
    let indent = repeatText('    ', level++);
    console.log(`\u001B[32m${indent} (${this._routeIndex}) ${this.constructor.name} ${this.path}\u001B[39m`);
    indent = repeatText('    ', level);

    forEach(this.routeStack, (mountables) => {
      const type = mountables.constructor.name;
      if (type !== 'Route') mountables.describe(level);
      else {
        console.log(`\u001B[36m${indent}${type} (${mountables._routeIndex}) - ${mountables.path}\u001B[39m`);
        forEach(mountables.stack, (layer, layerIndex) => {
          console.log(`${indent}  └──────(${layerIndex}) ${layer.name || '-'} [${layer.method}]`);
        });
      }
    });
  }
}

function _register(self, method, ...args) {
  const { stack, settings } = self;
  const path = typeof args[0] === 'string' ? args.shift() : '*';
  stack.push(new Route(method, path, flatten(args), settings));
}

module.exports = Router;
