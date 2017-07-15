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
    console.log('started');
    const method = event.httpMethod.toLowerCase();
    const req = Object.assign({}, event, {
      app: this,
      params: {},
      httpMethod: method,
      method
    });

    Object.assign(this, {
      context,
      callback,
      req
    });

    const res = new Response(this);
    this.res = res;
    res.req = req;
    req.res = res;

    this.handleRequest(req, res);
  }

  describe(mountPrefix = '') {
    console.log('---------APP-DESCRIPTION---------\n');
    super.describe(mountPrefix);
    console.log('\n---------------------------------');
  }
}

module.exports = Application;
