const Request = require('./Request');
const Response = require('./Response');
const Router = require('./Router');

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings));

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

  listen(event, context, callback){
    this.context = context;
    this.callback = callback;
    const req = this.req = new Request(this, event);
    const res = this.res = new Response(this);
    res.req = req;
    req.res = res;
    if (this.enabled('x-powered-by')) res.header('x-powered-by', 'Valkyrie');
    this.handleRequest(req, res);
  }

  describe() {
    return `Application\n${super.describe()}`;
  }
}

module.exports = Application;
