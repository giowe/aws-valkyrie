'use strict';

const Response      = require('./Response');
const Router        = require('./Router');

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));
    this.locales = Object.create(null);

    const { get } = this;
    this.get = (...args) => {
      if (args.length === 1 && typeof args[0] === 'string') return this.settings[args[0]];
      return get(...args);
    };

    this.enable('x-powered-by');
  }

  static Router(settings) {
    return new Router(settings);
  }

  disable(name) {
    this.settings[name] = false;
    return this;
  }

  disabled(name) {
    return this.settings[name] === false;
  }

  enable(name) {
    this.settings[name] = true;
    return this;
  }

  enabled(name) {
    return this.settings[name] === true;
  }

  set(prop, value) {
    this.settings[prop] = value;
    return this;
  }

  handleRequest(req, res, mountPath = '', routeStartIndex = 0) {
    if (super.handleRequest(req, res, mountPath, routeStartIndex)) return true;
    if (!res.headersSent) {
      res.header('content-type', 'text/html');
      res.status(404).send(_htmlTemplate('Error', `<pre>Cannot ${req.method.toUpperCase()} ${req.path}</pre>`));
    }
  }

  handleError(err, req, res, mountPath = '', routeStartIndex = 0) {
    if (super.handleError(err, req, res, mountPath, routeStartIndex)) return true;
    if (!res.headersSent) {
      // eslint-disable-next-line no-console
      console.log(err);
      res.header('content-type', 'text/html');
      res.status(500).send(_htmlTemplate('Error', `<pre>${err.stack}</pre>`));
    }
  }

  listen(event, context, callback){
    const method = event.httpMethod.toLowerCase();
    const req = Object.assign({}, event, {
      app: this,
      params: {},
      httpMethod: method,
      method,
      query: event.queryStringParameters
    });

    this.context = context;
    this.callback = callback;
    this.req = req;

    const res = new Response(this);
    this.res = res;
    res.req = req;
    req.res = res;

    if (this.enabled('x-powered-by')) res.header('x-powered-by', 'Valkyrie');
    this.handleRequest(req, res);
  }

  //todo install freetree
  describe(options) {
    const { format } = Object.assign({ format: 'console' }, options);

    let string;
    if (['html', 'string', 'console'].includes(format)) {
      string = `─┬Application\n${super.describe({ format: 'string' })}`;
    }

    switch (format) {
      case 'html':
        return `</code>${string.replace(/\n/g, '</br>').replace(/ /g, '&nbsp;')}</code>`;
      case 'string':
        return string;
      case 'console':
        // eslint-disable-next-line no-console
        return console.log(string);
      case 'json':
        return { todo: 'todo' }; //todo
      default:
        throw new Error(`${format} is not a supported format; chose between "console", "string", "html" and "json"`);
    }
  }
}

function _htmlTemplate(title, body){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
}

module.exports = Application;
