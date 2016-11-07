'use strict';

const formatRequest = require('./format-request');
const Response      = require('./Response');
const Router        = require('./Router');
const State         = require('./State');
const _defaultSettings = {
  useContextSucceed: false
};

module.exports = class Application extends Router{
  constructor(settings) {
    settings = Object.assign({}, _defaultSettings, settings);
    super(settings);
    this.locales = Object.create(null);
    return this;
  };

  static Router(settings) { return new Router(settings); }

  static State() { return State; }

  start(req, context, callback){
    if(!State.started) State.started = true;
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
