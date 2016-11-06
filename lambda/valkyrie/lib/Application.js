'use strict';

const formatRequest = require('./format-request');
const Response      = require('./Response');
const Router        = require('./Router');

const _defaultSettings = {
  useContextSucceed: false
};

let _started;

module.exports = class Application extends Router{
  constructor(settings) {
    settings = Object.assign({}, _defaultSettings, settings);
    super(settings);
    this.locales = Object.create(null);
    return this;
  };

  static Router(settings) { return new Router(settings); }

  static get started() { return _started };

  start(req, context, callback){
    if(!Application.started) _started = true;
    else this.reset();

    this.context = context;
    this.callback = callback;

    this.req = formatRequest(req, this);
    this.res = new Response(this);

    this.req.res = this.res;
    this.res.req = this.req;

    const firstRoute = this.getNextRoute(this.req, this.res, 0);
    if (firstRoute) firstRoute.getNextFnHandler(this.req, this.res).call();
    else this.res.status(500).send('No routes found!');
  };
};
