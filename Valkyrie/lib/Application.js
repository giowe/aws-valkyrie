const Request = require('./Request');
const Response = require('./Response');
const Router = require('./Router');
const { compileETag } = require('./Utils');

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

  set(setting, value) {
    this.settings[setting] = value;
    switch (setting) {
      case 'etag':
        this.set('etag fn', compileETag(value));
        break;
        //todo
      // case 'query parser':
      //   this.set('query parser fn', compileQueryParser(value));
      //   break;
      // case 'trust proxy':
      //   this.set('trust proxy fn', compileTrust(value));
      //
      //   // trust proxy inherit back-compat
      //   Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
      //     configurable: true,
      //     value: false
      //   });
      //  break;
    }
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
    this.set('etag', 'weak');
    this.handleRequest(req, res);
  }

  describe() {
    return `Application\n${super.describe()}`;
  }
}

module.exports = Application;
