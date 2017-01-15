'use strict';

const Utils = require('./Utils');
const signCookie = require('cookie-signature').sign;


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

  // TO REVIEW
  cookie(name, value, options) {
    const opts = Object.assign({}, options); //CHANGED FROM EXPRESS
    const secret = this.app.req;  //CHANGED FROM EXPRESS
    const signed = opts.signed;

    if(signed && !secret) {
      throw new Error('cookieParser("secret") required for signed cookies');
    }

    var val = (
      typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value)
    );

    if (signed) {
      val = 's:' + signCookie(val, secret)
    }

    if ('maxAge' in opts){
      opts.expires = new Date(Date.now() + opts.maxAge);
      opt.maxAge /= 1000
    }

    if (opts.path == null ) {
      opts.path = '/';
    }

    this.append('Set-Cookie', cookie.serialize(name, String(val), opts));

    return this;
  }

  //TO REVIEW
  clearCookie(name, options) {
    var opts = Object.assign({ expires: new Date(1), path: ' /'}, options); //CHANGED FROM EXPRESS

    return this.cookie(name, '', opts);
  }

  end(data, encoding) {
    //TODO: do i really need this?
  }

  // TO REVIEW
  format(object){
    const req = this.app.req;
    const next = req.next;

    const fn =object.default;
    if (fn) delete object.default;

    var key = Object.keys(object).length > 0 ? req.accepts(keys) : false;

    this.vary("Accept");

    if (key) {
      this.set('Content-Type', normalizeTy)
    }


    return this;
  }

  vary(){
    pass;
  }

  set() {

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
