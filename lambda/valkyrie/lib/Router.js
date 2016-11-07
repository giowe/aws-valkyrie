'use strict';

const supportedMethods = require('./methods');
const Utils = require('./Utils');
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
      this[method] = function() { this._methodHandler(method, Array.from(arguments)); };
    });
    return this;
  }

  get started() {
    if (this._parent) return this._parent.started;
    return this._started;
  }

  use() {
    this._methodHandler('all', Array.from(arguments));
  };

  get path() {
    if (!this._parent) return this.mountpath;
    else return Utils.joinUrls(this._parent.path, this.mountpath);
  }

  _methodHandler(method, args) {
    if (this.started) return;
    let path = '*';
    const pathArg = args[0];
    if (typeof pathArg === 'string') {
      path = args.shift();
    } else if (Array.isArray(pathArg) && pathArg.length) {
      const flattenedPathArg = Utils.flatten(args.shift());
      if (typeof flattenedPathArg[0] === 'string') {
        return Utils.forEach(flattenedPathArg, path => this[method](path, args));
      }
    }

    let mountables = [];
    const argsLength = args.length;
    for (let i = 0; i < argsLength; i++) {
      const arg = args[i];
      if (['Function', 'Router', 'Application'].indexOf(arg.constructor.name) !== -1 ||
        (Array.isArray(arg) && arg.length && ['Function', 'Router', 'Application'].indexOf(arg[0].constructor.name) !== -1)) {
        mountables.push(arg);
      }
    }

    mountables = Utils.flatten(mountables);
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

  getNextRoute(req, res, fromIndex){
    if (typeof fromIndex === 'undefined') fromIndex = 0;
    const l = this.routeStack.length;
    for (let i = fromIndex; i < l; i++) {
      const mountables = this.routeStack[i];

      let route;
      switch (mountables.constructor.name) {
        case 'Route':
          route = mountables.matchPath(req, this.settings);
          break;
        case 'Application':
        case 'Router': {
          route = mountables.getNextRoute(req, res, 0);
          break;
        }
      }
      if (route) return route;
    }

    if (this._parent) {
      const route = this._parent.getNextRoute(req, res, this._routeIndex + 1);
      if (route) return route;
    }

    return new Route('*', 'all', (req, res) => { res.status(500).send('no route found.') });
  }

  /**
   * Debug function
   * @param level
   */
  describe(level) {
    if (typeof level !== 'number') level = 0;
    let indent = '';
    for (let i = 0; i < level; i++) indent += '│ ';
    console.log(`${indent}${this.constructor.name} (${this._routeIndex}) - ${this.path}`);

    const routeStackLength = this.routeStack.length;
    Utils.forEach(this.routeStack, (mountables, routeIndex) => {
      const type = mountables.constructor.name;

      const routeFrame = routeIndex < routeStackLength-1 || level !== 0? '├─ ' : '└─ ';
      const fnStackFrame1 = routeIndex < routeStackLength-1 || level !== 0? '│' : ' ';

      if (type !== 'Route') mountables.describe(level+1);
      else {
        console.log(`${indent}${routeFrame}${type} (${mountables._routeIndex}) - ${mountables.path}`);
        console.log(`${indent}${fnStackFrame1}   └──────┐`);
        const fnStack = mountables._fnStack;
        const fnStackLength = fnStack.length;
        Utils.forEach(fnStack, (fnStackElement, fnStackIndex) => {
          const fnStackFrame2 = fnStackIndex < fnStackLength-1? '├─ ' : '└─ ';
          console.log(`${indent}${fnStackFrame1}          ${fnStackFrame2}(${fnStackIndex}) [${fnStackElement.method}]`);
          if (fnStackIndex===fnStackLength-1 && routeIndex < routeStackLength -1) console.log(`${indent}│`);
        });
      }
    });
  }
};
