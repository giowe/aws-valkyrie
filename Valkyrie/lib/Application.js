const Request = require("./Request")
const Response = require("./Response")
const Router = require("./Router")
const { compileETag } = require("./Utils")

class Application extends Router{
  constructor(settings) {
    super(Object.assign({
      useContextSucceed: false
    }, settings))

    const { get } = this
    this.get = (...args) => {
      if (args.length === 1 && typeof args[0] === "string") return this.settings[args[0]]
      return get(...args)
    }

    this.enable("x-powered-by")
  }

  static Router(settings) {
    return new Router(settings)
  }

  disable(name) {
    this.settings[name] = false
    return this
  }

  disabled(name) {
    return this.settings[name] === false
  }

  enable(name) {
    this.settings[name] = true
    return this
  }

  enabled(name) {
    return this.settings[name] === true
  }

  set(setting, value) {
    this.settings[setting] = value
    switch (setting) {
      case "etag":
        this.set("etag fn", compileETag(value))
        break
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
    return this
  }

  listen(event, context, callback){
    this.context = context
    this.callback = callback
    this.engines = {}
    const req = this.req = new Request(this, event)
    const res = this.res = new Response(this)
    res.req = req
    req.res = res
    if (this.enabled("x-powered-by")) res.header("x-powered-by", "Valkyrie")
    this.set("etag", "weak")
    this.handleRequest(req, res)
  }

  //todo work in progress
  engine(ext, fn) {
    if (typeof fn !== "function") {
      throw new Error("callback function required")
    }

    // get file extension
    const extension = ext[0] !== "." ? `.${ext}` : ext

    // store engine
    this.engines[extension] = fn

    return this
  }

  //todo work in progress
  render(name, options, callback) {
    const { cache, engines, locals } = this
    const renderOptions = {}
    let done = callback
    let opts = options
    let view

    // support callback function as second arg
    if (typeof options === "function") {
      done = options
      opts = {}
    }

    // merge app.locals
    Object.apply(renderOptions, locals)

    // merge options._locals
    if (opts._locals) {
      Object.apply(renderOptions, opts._locals)
    }

    // merge options
    Object.apply(renderOptions, opts)

    // set .cache unless explicitly provided
    if (renderOptions.cache == null) {
      renderOptions.cache = this.enabled("view cache");
    }

    // primed cache
    if (renderOptions.cache) {
      view = cache[name]
    }

    // view
    if (!view) {
      const View = this.get("view")

      view = new View(name, {
        defaultEngine: this.get("view engine"),
        root: this.get("views"),
        engines
      })

      if (!view.path) {
        const dirs = Array.isArray(view.root) && view.root.length > 1
          ? `directories "${view.root.slice(0, -1).join("\", \"")}" or "${view.root[view.root.length - 1]}"`
          : `directory "${view.root}"`
        const err = new Error(`Failed to lookup view "${name}" in views ${dirs}`)
        err.view = view
        return done(err)
      }

      // prime the cache
      if (renderOptions.cache) {
        cache[name] = view
      }
    }

    // render
    _tryRender(view, renderOptions, done);
  }

  describe() {
    return `Application\n${super.describe()}`
  }
}

function _tryRender(view, options, callback) {
  try {
    view.render(options, callback)
  } catch (err) {
    callback(err)
  }
}

module.exports = Application
