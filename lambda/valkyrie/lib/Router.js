'use strict';

const Utils = require('./Utils');
const Route = require('./Route');

const _supportedHttpMethods = [
  'all', 'checkout', 'copy', 'delete', 'get', 'head', 'lock',
  'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify',
  'options', 'patch', 'post', 'purge', 'put', 'report',
  'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'
];

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
    Utils.forEach(_supportedHttpMethods, method => {
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
      mountable  = methods;
      methods = 'all';
      path       = '*';
    } else if (typeof mountable === 'undefined') {
      mountable  = path;
      path       = methods;
      methods = 'all';
    }

    if (typeof methods === 'string')  methods = [methods.toLowerCase()];
    else if (Array.isArray(methods)) Utils.forEach(methods, (method, i) => methods[i] = method.toLowerCase());

    switch (mountable.constructor.name) {
      case 'Function':
        new Route(methods, path, mountable).mount(this);
        break;

      case 'Application':
      case 'Router':
        //TODO valutare come passare l'http method
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
    const routeHandler = {};
    Utils.forEach(_supportedHttpMethods, method => {
      routeHandler[method] = (fn) => {
        this.use(method, path, fn);
        return routeHandler;
      }
    });
    return routeHandler;
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
