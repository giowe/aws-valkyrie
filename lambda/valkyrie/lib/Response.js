'use strict';

const mime = require('send').mime;
const Utils = require('./Utils');
const signCookie = require('cookie-signature').sign;
const deprecate = require('depd')('aws-valkyrie');
const vary = require('vary');
const cookie = require('cookie'); //TODO: add to package.json
const STATUS_CODES = require('http').STATUS_CODES;

const charsetRegExp = new RegExp('\;\s*charset\s*=');

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
  }

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
    const opts = Object.assign({}, options);
    const secret = this.app.req;
    const signed = opts.signed;

    if(signed && !secret) {
      throw new Error('cookieParser("secret") required for signed cookies');
    }

    let val = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

    if (signed) val = 's:' + signCookie(val, secret);

    if (opts.maxAge){
      opts.expires = new Date(Date.now() + opts.maxAge);
      opts.maxAge /= 1000
    }

    if (!opts.path) opts.path = '/';

    this.append('Set-Cookie', cookie.serialize(name, String(val), opts));

    return this;
  }


  clearCookie(name, options) {
    const opts = Object.assign({
      expires: new Date(1),
      path: ' /'
    }, options);
    return this.cookie(name, '', opts);
  }

  end(data, encoding) {
    //TODO: do i really need this?
  }

  format(object){
    const req = this.app.req;
    const next = req.next;

    const fn = object.default;
    if (fn) delete object.default;

    const key = Object.keys(object).length > 0 ? req.accepts(keys) : false;

    this.vary("Accept");

    if (key) {
      this.set('Content-Type', Utils.normalizeType(key).value);
      object[key](req, this, next)
    } else if (fn) {
      fn();
    } else {
      const err = new Error('Not Acceptable');
      err.status = err.statusCode = 406;
      err.types = normalizeTypes(keys).map(o => o.value);
      next(err);
    }

    return this;
  }

  vary(field){
    vary(this, field);
    return this;
  }

  header(field, val) {
    if (arguments.length === 2) {
      let value = Array.isArray(val) ? val.map(String) : String(val);

      if (field.toLowerCase() === 'content-type' && !charsetRegExp.test(value)) {
        const charset = mime.lookup(value.split(';')[0]);
        if (charset) value += ';charset=' + charset.toLowerCase();

        this.set(field, value);
      }
    } else {
      const keys = Object.keys(field);
      const l = keys.length;
      for (let i = 0; i < l; i++) {
        const key = keys[i];
        this.set(key, field[key]);
      }
    }

    return this;
  }

  set(field, val) {
    this.headers[field] = val;
   // this.header(field, val)
  }

  json(body){
    body = Utils.stringify(body, this.app.get('json replacer'), this.app.get('json spaces'));
    this.set('Content-Type', 'application/json');
    this.send(body);
  }

  jsonp(body){
    //TODO: do i want this ?
  }

  redirect(status=302, path) {
    const address = this.location(path).get('Location');
    let body;

    this.format({
      text: function(){
        body = STATUS_CODES[status] + '. Redirecting to ' + address;
      },

      html: function(){
        const u = escapeHtml(address);
        body = '<p>' + STATUS_CODES[status] + '. Redirecting to <a href="' + u + '">' + u + '</a></p>';
      },

      default: function(){
        body = '';
      }
    });

    this.statusCode = status;
    this.set('Content-Length', Buffer.byteLength(body));

    if (this.app.req.method === 'HEAD') {
      this.end();
    } else {
      this.end(body);
    }

  }

  render(view, locals, callback) {
    const app = this.app;
    let done = callback;
    let opts = locals || {};
    const req = this.app.req;

    if (typeof opts === 'function') {
      done = opts;
      opts = {};
    }

    opts._locals = this.locals;

    done = done || function (err, str) {
      if (err) return req.next(err);
      this.send(str);
    };

    app.render(view, opts, done);
  }

  send(body) {
    if (typeof body !== 'undefined') this.body = body;

    if (typeof body !== 'string') body = Utils.stringify(body);

    console.log(body);
    const response = {
      statusCode: this.statusCode,
      headers: JSON.stringify(this.headers),
      body
    };

    if (this.app.settings.useContextSucceed) this.context.succeed(response);
    else this.callback(null, response);
  }

    sendFile(s3Url){
      const next = this.app.req.next;
      if (arguments.length === 2) {
        //TODO: must be an s3url???
        this.redirect(s3Url)
      } else {
        const err = new Error('sendFile needs an arguments');
        next(err);
      }
  }

  sendStatus(statusCode) {
    this.status(statusCode);
    this.send(STATUS_CODES[statusCode] || String(statusCode));
  }

  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  //TODO: Do i need this?
  type(type){
    const ct = type.indexOf('/') === -1 ? mime.lookup(type) : type;

    return this.set('Content-Type', ct);
  }

  //TODO: Do I need this?
  location(url) {
    let loc = url;

    if (loc === 'back') {
      loc = this.app.req('Referrer') || '/';
    }

    return this.set('Location', encodeUrl(loc));
  }
};
