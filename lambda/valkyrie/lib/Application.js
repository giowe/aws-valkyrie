'use strict';

const Response      = require('./Response');
const Router        = require('./router/Router');

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));
    this.locales = Object.create(null);
    return this;
  }

  static Router(settings) { return new Router(settings); }

  start(event, context, callback){
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
      req,
      _started: true //todo valutare se possiamo levarla!
    });

    const res = new Response(this);
    this.res = res;
    res.req = req;
    req.res = res;

    const firstRoute = this.getNextRoute(req, res);
    if (firstRoute) firstRoute.getNextLayer(req, res).call();
  }
}

module.exports = Application;
