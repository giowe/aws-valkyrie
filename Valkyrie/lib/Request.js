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

module.exports = Request
