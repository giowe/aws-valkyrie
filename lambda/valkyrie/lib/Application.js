'use strict';

const Response      = require('./Response');
const Router        = require('./Router');

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));
    this.locales = Object.create(null);
    return this;
  }

  static Router(settings) { return new Router(settings); }

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

  describe(format = 'text') {
    return ['─┬APPLICATIN', ...super.describe()].join('\n');
  }
}

module.exports = Application;
