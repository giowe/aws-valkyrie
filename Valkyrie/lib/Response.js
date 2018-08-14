const mime  = require("mime")
const statuses = require("statuses")
const { stringify, setCharset, normalizeType } = require("./Utils")
const { sign } = require("cookie-signature")
const { extname } = require("path")
const cookie = require("cookie")
const encodeUrl = require("encodeurl")
const contentDisposition = require("content-disposition")
const vary = require("vary")
const escapeHtml = require("escape-html")
const charsetRegExp = /;\s*charset\s*=/

class Response {
  constructor(app) {
    this.headersSent = false
    this.app = app
    this.context = app.context
    this.callback = app.callback
    this.statusCode = 200
    this.headers = Object.create(null)
    this.req = null
    return this
  }

  //tested
  status(code) {
    this.statusCode = code
    return this
  }

  //tested
  sendStatus(statusCode) {
    const body = statuses[statusCode] || String(statusCode)
    this.statusCode = statusCode
    this.type("txt")
    return this.send(body)
  }

  //tested
  links(links) {
    let link = this.get("Link") || ""
    if (link) link += ", "
    return this.set("Link", link + Object.keys(links).map(rel => `<${links[rel]}>; rel="${rel}"`).join(", "))
  }

  //todo wrk in progress
  send(body) {
    const {
      headersSent,
      statusCode,
      headers,
      app,
      req,
      callback,
      context
    } = this

    if (headersSent) throw new Error("Response already sent;")

    const is204or304 = [204, 304].includes(statusCode)
    if (!req.method === "HEAD" || !is204or304) {
      const type = this.get("Content-Type")
      if (typeof body !== "string") {
        body = stringify(body)
        if (!type) this.type("bin")
      } else if (!type) {
        this.type("html")
      } else {
        this.set("Content-Type", setCharset(type, "utf-8"))
      }

      if (typeof body !== "undefined") {
        this.set("Content-Length", body.length)
      }
    } else {
      if (is204or304) {
        this.removeHeader("Content-Type")
        this.removeHeader("Content-Length")
        this.removeHeader("Transfer-Encoding")
      }
      body = null
    }

    // populate ETag
    let etag
    const generateETag = app.get("etag fn")
    if (typeof generateETag === "function" && !this.get("ETag")) {
      if ((etag = generateETag(body, "utf-8"))) {
        this.set("ETag", etag)
      }
    }

    // freshness
    //if (req.fresh) this.statusCode = 304;//todo missing req.fresh

    const response = { statusCode, headers, body }

    this.headersSent = true
    if (app.settings.useContextSucceed) context.succeed(response)
    else callback(null, response)
  }

  //tested
  json(obj) {
    const { app } = this
    const body = stringify(obj, app.get("json replacer"), app.get("json spaces"))

    if (!this.get("Content-Type")) {
      this.set("Content-Type", "application/json")
    }

    return this.send(body)
  }

  //tested
  type(type) {
    const contentType = type.indexOf("/") === -1 ? mime.getType(type) : type
    return this.set("Content-Type", contentType || "application/octet-stream")
  }

  //todo TO TEST!
  format(obj) {
    //todo check next in req
    const { req } = this
    const { next } = req

    const fn = obj.default
    if (fn) delete obj.default
    const keys = Object.keys(obj)

    const key = keys.length > 0 ? req.accepts(keys) : false

    this.vary("Accept")

    if (key) {
      this.set("Content-Type", normalizeType(key).value)
      obj[key](req, this, next)
    } else if (fn) {
      fn()
    } else {
      const err = new Error("Not Acceptable")
      err.status = err.statusCode = 406
      err.types = keys.map(o => normalizeType(o).value)
      next(err)
    }

    return this
  }

  //tested
  attachment(filename) {
    if (filename) {
      this.type(extname(filename))
    }
    this.set("Content-Disposition", contentDisposition(filename))
    return this
  }

  //tested
  append(field, val) {
    const prev = this.get(field)
    let value = val

    if (prev) {
      value = Array.isArray(prev) ? prev.concat(val)
        : Array.isArray(val) ? [prev].concat(val) : [prev, val]
    }

    return this.set(field, value)
  }

  //tested
  header(field, val) {
    return this.set(field, val)
  }
  setHeader(field, val) {
    return this.set(field, val)
  }
  set(field, val) {
    field = field.toLowerCase()
    if (arguments.length === 2) {
      const valueIsArray = Array.isArray(val)
      let value = valueIsArray ? val.map(String) : String(val)

      if (field === "content-type") {
        if (valueIsArray) {
          throw new TypeError("Content-Type cannot be set to an Array")
        }
        if (!charsetRegExp.test(value) && value.indexOf("text") !== -1) {
          value += "; charset=utf-8"
        }
      }

      this.headers[field] = value
      //this.headers[field] = !valueIsArray ? value : value.join(', ');
    } else {
      Object.entries(field).forEach(([key, value]) => this.set(key, value))
    }
    return this
  }

  //tested
  getHeader(field) {
    return this.get(field)
  }
  get(field) {
    return this.headers[field.toLowerCase()]
  }

  //tested
  clearCookie(name, options) {
    return this.cookie(name, "", Object.assign({
      expires: new Date(1),
      path: "/"
    }, options))
  }

  //tested
  cookie(name, value, options) {
    const opts = Object.assign({}, options)
    const { secret } = this.req
    const { signed } = opts

    if (signed && !secret) {
      throw new Error("cookieParser(\"secret\") required for signed cookies")
    }

    let val = typeof value === "object" ?
      "j:" + JSON.stringify(value) :
      String(value)

    if (signed) {
      val = "s:" + sign(val, secret)
    }

    if ("maxAge" in opts) {
      opts.expires = new Date(Date.now() + opts.maxAge)
      opts.maxAge /= 1000
    }

    if (!opts.path) {
      opts.path = "/"
    }

    this.append("set-cookie", [cookie.serialize(name, String(val), opts)])
    return this
  }

  //tested
  location(url) {
    let loc = url
    if (url === "back") {
      loc = this.req.get("Referrer") || "/"
    }
    return this.set("Location", encodeUrl(loc))
  }

  //tested
  redirect(url) {
    let address = url
    let body
    let status = 302

    // allow status / url
    if (arguments.length === 2) {
      [status, address] = arguments
    }

    // Set location header
    address = this.location(address).get("Location")

    // Support text/{plain,html} by default
    this.format({
      text: () => body = `${statuses[status]}. Redirecting to ${address}`,
      html: () => {
        const u = escapeHtml(address)
        body = `<p>${statuses[status]}. Redirecting to <a href="${u}">${u}</a></p>`
      },
      default: () => body = ""
    })

    // Respond
    this.statusCode = status
    this.set("Content-Length", Buffer.byteLength(body))

    if (this.req.method === "HEAD") {
      this.send()
    } else {
      this.send(body)
    }
  }

  //tested
  vary(field) {
    vary(this, field)
    return this
  }

  //todo!
  render(view, options, callback) {

  }

  //tested
  removeHeader(field) {
    delete this.headers[field]
  }
}

module.exports = Response
