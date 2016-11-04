'use strict';

const defaultMethods = require('./methods');
const Utils   = require('./Utils');
const Route   = require('./Route');

const _defaultSettings =  {
  sensitive: false, //When true the path will be case sensitive
  strict: false,    //When false the trailing slash is optional
  end: true,        //When false the path will match at the beginning
  delimiter: '/'    //Set the default delimiter for repeat parameters
};

module.exports = class Router {
  constructor(settings) {
    this.settings = Object.assign({}, _defaultSettings, settings);
    this.stack = [];
    this.mountpath = '';
    this.parent = null;
    this.stackIndex = null;
    Utils.forEach(defaultMethods, method => {
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

    if (typeof methods === 'string')  methods = [methods.toLowerCase()];
    else if (Array.isArray(methods)) Utils.forEach(methods, (method, i) => methods[i] = method.toLowerCase());

    switch (mountable.constructor.name) {
      case 'Function':
        const fnsContainer = {};
        Utils.forEach(methods, method => {
          fnsContainer[method] = mountable;
        });
        new Route(methods, path, fnsContainer).mount(this);
        break;

      case 'Application':
      case 'Router':
        //TODO can't mount with other t
        mountable.mount(this, path);
        break;
    }
  };

  mount(parent, mountpath){
    this.mountpath = mountpath;
    this.parent = parent;
    this.stackIndex = parent.stack.length;
    parent.stack.push(this);
    return this;
  }

  route(path) {
    const l = this.stack.length;
    for (let i = 0; i < l; i++) {
      if (this.stack[i].constructor.name !== 'Route') continue;

      const route = this.stack[i];

      if (path === route.basePath) {
        return route;
      }
    }

    return new Route([], path, {}).mount(this);
  }

  getNextRoute(req, res, fromIndex){
    const l = this.stack.length;
    for (let i = fromIndex; i < l; i++) {
      const mountable = this.stack[i];

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
      const route = this.parent.getNextRoute(req, res, this.stackIndex + 1);
      if (route) return route;
    }

    return null;
  }

  describe(level) {
    if (typeof level !== 'number') level = 0;
    let indent = '';
    for (let i = 0; i < level; i++) indent += '│  ';
    console.log(`${indent}${this.constructor.name} [${this.stackIndex}] ${this.path}`);

    const l = this.stack.length;
    Utils.forEach(this.stack, (mountable, i) => {
      const type = mountable.constructor.name;
      const frame = i < l-1 || level !== 0? '├─ ' : '└─ ';
      if (type !== 'Route') mountable.describe(level+1);
      else console.log(`${indent}${frame}${type} (${mountable.stackIndex}) ${mountable.methods} ${mountable.path}`);
    });
  }
};
