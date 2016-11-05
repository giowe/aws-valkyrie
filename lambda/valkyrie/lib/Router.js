'use strict';

const methods = require('./methods');
const Utils   = require('./Utils');
const Route   = require('./Route');

methods.push('all');
const _defaultSettings =  {
  sensitive: false, //When true the path will be case sensitive
  strict: false,    //When false the trailing slash is optional
  end: true,        //When false the path will match at the beginning
  delimiter: '/'    //Set the default delimiter for repeat parameters
};

module.exports = class Router {
  constructor(settings) {
    this.settings = Object.assign({}, _defaultSettings, settings);
    this.routeStack = [];
    this.mountpath = '';
    this.parent = null;
    this.routeIndex = null;

    Utils.forEach(methods, method => {
      this[method] = (path, fn) => this.use(method, path, fn);
    });
    return this;
  }

  get path() {
    if (!this.parent) return this.mountpath;
    else return Utils.joinUrls(this.parent.path, this.mountpath);
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

    if (Array.isArray(path)) Utils.forEach(Utils.flatten(path), path => this.use(methods, path, mountable) );

    if (typeof methods === 'string')  methods = [methods.toLowerCase()];
    else if (Array.isArray(methods)) Utils.forEach(methods, (method, i) => methods[i] = method.toLowerCase());

    switch (mountable.constructor.name) {
      case 'Array':
        Utils.forEach(Utils.flatten(mountable), mountable => this.use(methods, path, mountable));
        break;

      case 'Function':
        const fnHandlers = {};
        Utils.forEach(methods, method => {
          fnHandlers[method] = mountable;
        });
        new Route(path, fnHandlers).mount(this);
        break;

      case 'Application':
      case 'Router':
        //TODO can't mount with other Router or App with other then "use"
        mountable.mount(path, this);
        break;
    }
  };

  mount(mountpath, parent){
    this.mountpath = mountpath;
    this.parent = parent;
    this.routeIndex = parent.routeStack.length;
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

    if (this.parent) {
      const route = this.parent.getNextRoute(req, res, this.routeIndex + 1);
      if (route) return route;
    }

    return null;
  }

  describe(level) {
    if (typeof level !== 'number') level = 0;
    let indent = '';
    for (let i = 0; i < level; i++) indent += '│  ';
    console.log(`${indent}${this.constructor.name} (${this.routeIndex}) - ${this.path}`);

    const l = this.routeStack.length;
    Utils.forEach(this.routeStack, (mountable, i) => {
      const type = mountable.constructor.name;
      const frame = i < l-1 || level !== 0? '├─ ' : '└─ ';
      if (type !== 'Route') mountable.describe(level+1);
      else console.log(`${indent}${frame}${type} (${mountable.routeIndex}) [${mountable.methods}] - ${mountable.path}`);
    });
  }
};
