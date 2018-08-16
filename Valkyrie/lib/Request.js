const fresh = require("fresh")
const accepts = require("accepts")
class Request {
  constructor(app, event) {
    const method = event.httpMethod.toLowerCase()
    Object.assign(this, event, {
      app,
      httpMethod: method,
      method,
      query: event.queryStringParameters
    })

    if (!this.params) this.params = {}
    if (!this.body) this.body = {}

    const headers = {}
    Object.entries(this.headers).forEach(([key, value]) => headers[key.toLowerCase()] = value)
    this.headers = headers

    _defineGetter(this, "fresh", () => {
      const { method, res } = this
      const status = res.statusCode

      // GET or HEAD for weak freshness validation only
      if ("GET" !== method && "HEAD" !== method) {
        return false
      }

      // 2xx or 304 as per rfc2616 14.26
      if ((status >= 200 && status < 300) || 304 === status) {
        return fresh(this.headers, {
          "etag": res.get("ETag"),
          "last-modified": res.get("Last-Modified")
        })
      }

      return false
    })

    _defineGetter(this, "stale", function stale(){
      return !this.fresh
    })

    return this
  }

  accepts() {
    const accept = accepts(this)
    return accept.types.apply(accept, arguments)
  }

  get(field){
    return this.headers[field.toLowerCase()]
  }
}

function _defineGetter(obj, name, getter) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get: getter
  })
}

module.exports = Request
