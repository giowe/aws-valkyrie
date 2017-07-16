'use strict';

const Response      = require('./Response');
const Router        = require('./Router');

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));
    this.locales = Object.create(null);
  }

  static Router(settings) {
    return new Router(settings);
  }

  listen(event, context, callback){
    const method = event.httpMethod.toLowerCase();
    const req = Object.assign({}, event, {
      app: this,
      params: {},
      httpMethod: method,
      method
    });

    this.context = context;
    this.callback = callback;
    this.req = req;

    const res = new Response(this);
    this.res = res;
    res.req = req;
    req.res = res;

    this.handleRequest(req, res);
  }

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
        return {};
      default:
        throw new Error(`${format} is not a supported format; chose between "console", "string", "html" and "json"`);
    }
  }
}

module.exports = Application;
