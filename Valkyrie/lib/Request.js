'use strict';

class Request {
  constructor(app, event) {
    const method = event.httpMethod.toLowerCase();
    Object.assign(this, event, {
      app,
      httpMethod: method,
      method,
      query: event.queryStringParameters
    });

    if (!this.params) this.params = {};
    if (!this.body) this.body = {};

    const headers = {};
    Object.entries(this.headers).forEach(([key, value]) => headers[key.toLowerCase()] = value);
    this.headers = headers;
    return this;
  }

  get(field){
    return this.headers[field.toLowerCase()];
  }
}

module.exports = Request;
