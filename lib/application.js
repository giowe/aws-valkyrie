'use strict';

const formatRequest = require('./format-request');
const Response      = require('./response');
const Router        = require('./router');

module.exports = class Application extends Router{
  constructor(options) {
    super(options);
    return this;
  };

  static Router(options) { return new Router(options); }

  start(req, context){
    this.req = formatRequest(req);
    this.res = new Response(this.req, context);

    const firstMiddleware = this.getNextMiddleware(this.req, this.res, 0);
    if (firstMiddleware) firstMiddleware.fnWrapper(this.req, this.res)();
  };
};
