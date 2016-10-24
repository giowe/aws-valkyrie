'use strict';

module.exports = class Response {
  constructor(req, context) {
    this.req = req;
    this.context = context;
    this.statusCode = 200;
    this.headers = null;
    this.body = Object.create(null);
    return this;
  };

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  send(body) {
    if (typeof body === 'undefined') body = this.body;
    else if (typeof body === 'object') {
      try {
        body = JSON.stringify(body);
      } catch (err) {
        body = body.toString();
      }
    }

    this.context.succeed({
      statusCode: this.statusCode,
      headers: this.headers,
      body: body
    });
  }
};
