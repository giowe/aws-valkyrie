'use strict';

const Utils = require('./Utils');

module.exports = class Response {
  constructor(app) {
    this.app = app;
    this.context = app.context;
    this.callback = app.callback;
    this.locals = Object.create(null);
    this.statusCode = 200;
    this.headers = Object.create(null);
    this.body = null;
    return this;
  };

  append(key, value) {
    if ( typeof value !== 'undefined' ) {
      this.headers[key] = Utils.stringify(value);
    } else if ( typeof key === 'object' ){
      const obj = key;
      Utils.forEach(Object.keys(obj), key => this.append(key, obj[key]) );
    }
    return this;
  }

  cookie(name, value, options) {
    //TODO
    return this;
  }

  clearCookie(name, options) {
    //TODO
    return this;
  }

  end(data, encoding) {
    //TODO: do i really need this?
  }

  format(object){
    //TODO
    return this;
  }

  json(body){
    //TODO: do i want this or i just want to have a smart, body aware, send method?
  }

  jsonp(body){
    //TODO: do i want this ?
  }

  redirect(status, path) {
    //TODO: do i want this ?
  }

  render(view, locals, callback) {
    //TODO
  }

  send(body) {
    if (typeof body !== 'undefined') this.body = body;

    const response = {
      statusCode: this.statusCode,
      headers: this.headers,
      body: Utils.stringify(this.body)
    };

    if (this.app.settings.useContextSucceed) this.context.succeed(response);
    else this.callback(null, response);
  }

  sendFile(){
    //TODO: send file from s3 ?
  }

  sendStatus(statusCode) {
    const statusCodes  = require('http').STATUS_CODES;
    this.status(statusCode);
    this.send(statusCodes[statusCode] || String(statusCode));
  }

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  type(type){
    //TODO: Do i need this?
  }
};
