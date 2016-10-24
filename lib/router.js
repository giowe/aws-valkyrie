'use strict';

const Utils = require('./utils');
const Middleware = require('./middleware');

const _supportedHttpMethods = [
  'checkout', 'copy', 'delete', 'get', 'head', 'lock',
  'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify',
  'options', 'patch', 'post', 'purge', 'put', 'report',
  'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'
];

const _defaultOptions =  {
  sensitive: false, //When true the route will be case sensitive
  strict: false,    //When false the trailing slash is optional
  end: true,        //When false the path will match at the beginning
  delimiter: '/'    //Set the default delimiter for repeat parameters
};

module.exports = class Router {
  constructor(options) {
    this.options = Object.assign({}, _defaultOptions, options);
    this.stack = [];
    this.prefix = '';
    this.parent = null;
    this.stackIndex = null;

    Utils.forEach(_supportedHttpMethods, httpMethod => {
      this[httpMethod] = (path, fn) => {
        this.use(httpMethod.toUpperCase(), path, fn);
      }
    });

    return this;
  }

  all(path, chainable) {
    this.use('*', path, chainable);
  };

  use(httpMethod, path, chainable) {
    if (typeof path === 'undefined' && typeof chainable === 'undefined') {
      chainable  = httpMethod;
      httpMethod = 'all';
      path       = '*';
    } else if (typeof chainable === 'undefined') {
      chainable  = path;
      path       = httpMethod;
      httpMethod = 'all';
    }

    switch (chainable.constructor.name) {
      case 'Function':
        new Middleware(httpMethod, path, chainable).addToStack(this);
        break;

      case 'Application':
      case 'Router':
        chainable.addToStack(this, path);
        break;
    }
  };

  addToStack(parent, prefix){
    this.prefix = prefix;
    this.parent = parent;
    this.stackIndex = parent.stack.length+1;
    parent.stack.push(this);
    return this;
  }

  getNextMiddleware(req, res, fromIndex){
    const l = this.stack.length;
    for (let i = fromIndex; i < l; i++) {
      const chainable = this.stack[i];

      let middleware;
      switch (chainable.constructor.name) {
        case 'Middleware':
          middleware = chainable.matchRequest(req, this.options);
          break;
        case 'Application':
        case 'Router': {
          middleware = chainable.getNextMiddleware(req, res, 0);
          break;
        }
      }
      if (middleware) return middleware;
    }

    if (this.parent) {
      const middleware = this.parent.getNextMiddleware(req, res, this.stachIndex);
      if (middleware) return middleware;
    }

    return null;
  }
};
