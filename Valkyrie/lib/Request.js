'use strict';

class Request {
  constructor(app, event) {
    const method = event.httpMethod.toLowerCase();
    Object.assign(this, event, {
      app,
      params: {},
      httpMethod: method,
      method,
      query: event.queryStringParameters
    });

    /*const headers = {};
    Object.entries(this.headers).forEach(([key, value]) => headers[key.toLowerCase()] = value);
    this.headers = headers;*/
    return this;
  }

  get(field){
    return this.headers[field.toLowerCase()];
  }
}

module.exports = Request;
