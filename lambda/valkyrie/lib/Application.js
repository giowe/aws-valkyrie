'use strict';

const formatRequest = require('./format-request');
const Response      = require('./Response');
const Router        = require('./router/Router');

module.exports = class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));
    this.locales = Object.create(null);
    return this;
  };

  static Router(settings) { return new Router(settings); }

  start(req, context, callback){
    this._started = true;

    this.context = context;
    this.callback = callback;

    this.req = formatRequest(req, this);
    this.res = new Response(this);

    this.req.res = this.res;
    this.res.req = this.req;

    const firstRoute = this.getNextRoute(this.req, this.res);
    if (firstRoute) firstRoute.getNextLayer(this.req, this.res).call();
  };
};
