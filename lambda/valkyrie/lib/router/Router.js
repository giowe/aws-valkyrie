'use strict';

const supportedMethods = require('./../methods');
const Utils = require('./../Utils');
const Route = require('./Route');

supportedMethods.push('all');
const _defaultSettings =  {
  sensitive: false, //When true the path will be case sensitive
  strict: false,    //When false the trailing slash is optional
  end: true,        //When false the path will match at the beginning
  delimiter: '/'    //Set the default delimiter for repeat parameters
};

let _fakeRoute;
module.exports = class Router {
  constructor(settings) {
    this.mountpath = '';
    this.settings = Object.assign({}, _defaultSettings, settings);
    this.routeStack = [];
    this._routeIndex = null;
    this._parent = null;
    this._started = false;

    Utils.forEach(supportedMethods, method => {
      this[method] = function() { this._methodHandle(method, Array.from(arguments)); };
    });
    return this;
  }

//  get mountpathx() { return this.mountpaths}
//  set mountpathx(value) {}

  get started() {
    if (this._parent) return this._parent.started;
    return this._started;
  }

  use() {
    this._methodHandle('all', Array.from(arguments));
  };

  get path() {
    if (!this._parent) return this.mountpath;
    else return Utils.joinUrls(this._parent.path, this.mountpath);
  }

  _methodHandle(method, args) {
    if (this.started) return;

    let path = '*';
    let pathArg = args[0];
    if (typeof pathArg === 'string') {
      path = args.shift();
    } else if (Array.isArray(pathArg) && pathArg.length) {
      pathArg = Utils.flatten(pathArg);
      if (typeof pathArg[0] === 'string') {
        return Utils.forEach(args.shift(), path => this[method](path, args));
      }
    }

    const mountables = [];
    args = Utils.flatten(args);
    Utils.forEach(args, arg => {
      if (['Function', 'Router', 'Application'].indexOf(arg.constructor.name) !== -1) mountables.push(arg);
    });

    let route;
    Utils.forEach(mountables, mountable => {
      switch (mountable.constructor.name) {
        case 'Function':
          if (!route) route = new Route(path).mount(this);
          route[method](mountable);
          break;

        case 'Application':
        case 'Router':
          route = null;
          mountable._mount(path, this);
          break;
      }
    });
  }

  _mount(mountpath, parent){
    this.mountpath = mountpath;
    this._parent = parent;
    this._routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this;
  }

  route(path) {
    if (this.started) {
      if (!_fakeRoute) _fakeRoute = new Route(path);
      return _fakeRoute;
    }
    return new Route(path).mount(this);
  }


  //todo sparisce
  getNextRoute(req, res, stackStartIndex){
    if (typeof stackStartIndex === 'undefined') stackStartIndex = 0;

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

    return new Route('*').all( (req, res) => { res.status(500).send('no route found.') } );
  }

  /**
   * Debug function
   * @param level
   */
  describe(level) {
    if (typeof level !== 'number') level = 0;
    let indent = Utils.repeatText('    ', level++);
    console.log(`\u001B[32m${indent} (${this._routeIndex}) ${this.constructor.name} ${this.path}\u001B[39m`);
    indent = Utils.repeatText('    ', level);

    Utils.forEach(this.routeStack, (mountables) => {
      const type = mountables.constructor.name;
      if (type !== 'Route') mountables.describe(level);
      else {
        console.log(`\u001B[36m${indent}${type} (${mountables._routeIndex}) - ${mountables.path}\u001B[39m`);
        Utils.forEach(mountables.stack, (layer, layerIndex) => {
          console.log(`${indent}  └──────(${layerIndex}) ${layer.name || '-'} [${layer.method}]`);
        });
      }
    });
  }
};
