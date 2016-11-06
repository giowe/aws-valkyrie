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

    this.use = this._generateMethodHandler('all');
    Utils.forEach(supportedMethods, method => {
      this[method] = this._generateMethodHandler(method);
    });
    return this;
  }

  get path() {
    if (!this._parent) return this.mountpath;
    else return Utils.joinUrls(this._parent.path, this.mountpath);
  }

  _generateMethodHandler(method){
    return () => {
      const args = Array.from(arguments);

      let mountables = [];
      let paths = [];
      Utils.forEach(args, arg => {
        const typeOfArg = typeof arg;
        if (typeOfArg === 'function' || (Array.isArray(arg) && arg.length > 1 && typeof arg[0] === 'function')) {
          mountables.push(arg);
        } else if (typeOfArg === 'string' || (Array.isArray(arg) && arg.length > 1 && typeof arg[0] === 'function')) {
          paths.push(arg);
        }
      });

      paths = Utils.flatten(paths);
      let path = '*';
      const pathsLength = paths.length;
      if (pathsLength === 1) path = paths[0];
      else if (pathsLength > 1) return Utils.forEach(paths, path => this[method](path, mountables) );

      Utils.forEach(Utils.flatten(mountables), mountable => {
        switch (mountable.constructor.name) {
          case 'Function':
            new Route(path, method, mountable).mount(this);
            break;

          case 'Application':
          case 'Router':
            mountable.mount(path, this);
            break;
        }
      });
    }
  }

  // use(){//, mountables) {
  //   const args = Array.from(arguments);
  //   let methods = 'all';
  //   let path    = '*';
  //
  //   switch (args.length) {
  //     case 1:
  //       methods   = 'all';
  //       path      = '*';
  //       break;
  //     case 2:
  //       path      = args[1];
  //   }
  //
  //   /*if (typeof path === 'undefined' && typeof mountables === 'undefined') {
  //     //mountables = methods;
  //     methods   = 'all';
  //     path      = '*';
  //   } else if (typeof mountables === 'undefined') {
  //     //mountables = path;
  //     path      = methods;
  //     methods   = 'all';
  //   }*/
  //
  //   const mountables = [];
  //   Utils.forEach(args, arg => {
  //     if (typeof arg === 'function' || (Array.isArray(arg) && arg.length > 1 && typeof arg[0] === 'function')) {
  //       mountables.push(arg);
  //     }
  //   });
  //
  //   if (Array.isArray(path)) return Utils.forEach(Utils.flatten(path), path => this.use(methods, path, mountables) );
  //
  //   if (typeof methods === 'string')  methods = [methods.toLowerCase()];
  //   else if (Array.isArray(methods)) Utils.forEach(methods, (method, i) => methods[i] = method.toLowerCase());
  //
  //   switch (mountables.constructor.name) {
  //     case 'Array':
  //     case 'Function':
  //       new Route(path, methods, mountables).mount(this);
  //       break;
  //
  //     case 'Application':
  //     case 'Router':
  //       mountables.mount(path, this);
  //       break;
  //   }
  // };

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
      const mountables = this.routeStack[i];

      let route;
      switch (mountables.constructor.name) {
        case 'Route':
          route = mountables.matchRequest(req, this.settings);
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
