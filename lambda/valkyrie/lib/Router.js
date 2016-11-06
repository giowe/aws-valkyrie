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

module.exports = class Router {
  constructor(settings) {
    this.mountpath = '';
    this.settings = Object.assign({}, _defaultSettings, settings);
    this.routeStack = [];
    this._routeIndex = null;
    this._parent = null;

    Utils.forEach(supportedMethods, method => {
      this[method] = (path, fn) => this.use(method, path, fn);
    });
    return this;
  }

  get path() {
    if (!this._parent) return this.mountpath;
    else return Utils.joinUrls(this._parent.path, this.mountpath);
  }

  use(methods, path, mountable) {
    if (typeof path === 'undefined' && typeof mountable === 'undefined') {
      mountable = methods;
      methods   = 'all';
      path      = '*';
    } else if (typeof mountable === 'undefined') {
      mountable = path;
      path      = methods;
      methods   = 'all';
    }

    if (Array.isArray(path)) return Utils.forEach(Utils.flatten(path), path => this.use(methods, path, mountable) );

    if (typeof methods === 'string')  methods = [methods.toLowerCase()];
    else if (Array.isArray(methods)) Utils.forEach(methods, (method, i) => methods[i] = method.toLowerCase());

    switch (mountable.constructor.name) {
      case 'Array':
      case 'Function':
        new Route(path, methods, mountable).mount(this);
        break;

      case 'Application':
      case 'Router':
        mountable.mount(path, this);
        break;
    }
  };

  mount(mountpath, parent){
    this.mountpath = mountpath;
    this._parent = parent;
    this._routeIndex = parent.routeStack.length;
    parent.routeStack.push(this);
    return this;
  }

  route(path) {
    return new Route(path).mount(this);
  }

  getNextRoute(req, res, fromIndex){
    const l = this.routeStack.length;
    for (let i = fromIndex; i < l; i++) {
      const mountable = this.routeStack[i];

      let route;
      switch (mountable.constructor.name) {
        case 'Route':
          route = mountable.matchRequest(req, this.settings);
          break;
        case 'Application':
        case 'Router': {
          route = mountable.getNextRoute(req, res, 0);
          break;
        }
      }
      if (route) return route;
    }

    if (this._parent) {
      const route = this._parent.getNextRoute(req, res, this._routeIndex + 1);
      if (route) return route;
    }

    return null;
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
    Utils.forEach(this.routeStack, (mountable, routeIndex) => {
      const type = mountable.constructor.name;

      const routeFrame = routeIndex < routeStackLength-1 || level !== 0? '├─ ' : '└─ ';
      const fnStackFrame1 = routeIndex < routeStackLength-1 || level !== 0? '│' : ' ';

      if (type !== 'Route') mountable.describe(level+1);
      else {
        console.log(`${indent}${routeFrame}${type} (${mountable._routeIndex}) - ${mountable.path}`);
        console.log(`${indent}${fnStackFrame1}   └──────┐`);
        const fnStack = mountable._fnStack;
        const fnStackLength = fnStack.length;
        Utils.forEach(fnStack, (fnStackElement, fnStackIndex) => {
          const fnStackFrame2 = fnStackIndex < fnStackLength-1? '├─ ' : '└─ ';
          console.log(`${indent}${fnStackFrame1}          ${fnStackFrame2}(${fnStackIndex}) [${fnStackElement.methods}]`);
          if (fnStackIndex===fnStackLength-1 && routeIndex < routeStackLength -1) console.log(`${indent}│`);
        });
      }
    });
  }
};
