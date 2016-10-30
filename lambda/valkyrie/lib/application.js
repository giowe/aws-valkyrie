'use strict';

const formatRequest = require('./format-request');
const Response      = require('./response');
const Router        = require('./router');

const _defaultSettings = {
  useContextSucceed: false
};

module.exports = class Application extends Router{
  constructor(settings) {
    settings = Object.assign({}, _defaultSettings, settings);
    super(settings);
    return this;
  };

  static Router(settings) { return new Router(settings); }

  start(req, context, callback){
    this.context = context;
    this.callback = callback;
    this.req = formatRequest(req, this);
    this.res = new Response(this);

    const firstMiddleware = this.getNextMiddleware(this.req, this.res, 0);
    if (firstMiddleware) firstMiddleware.fnWrapper(this.req, this.res)();
  };
};
