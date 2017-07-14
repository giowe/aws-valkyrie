'use strict';


//TODO: REVIEW
var mime = require('send').mime;

function _acceptParams(str, index) {
  var parts = str.split(/ *; */);
  var ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

  for (var i = 1; i < parts.length; ++i) {
    var pms = parts[i].split(/ *= */);
    if ('q' === pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      ret.params[pms[0]] = pms[1];
    }
  }

  return ret;
}




module.exports = class Utils {
  static forEach(arr, fn) {
    let i = 0;
    const len = arr.length;
    while (i < len) {
      fn (arr[i], i);
      i++;
    }
  };

  static decodeURIParam(param) {
    try { return decodeURIComponent(param); }
    catch (err) { return err.toString() }
  };

  static stringify(entity) {
    if (typeof entity === 'object') {
      try {
        const cache = [];
        return JSON.stringify(entity, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) return '[Circular]';
            cache.push(value);
          }
          return value;
        });
      } catch (err) {
        return String(entity);
      }
    }

    return String(entity);
  }


  static flatten(array) {
    return array.reduce(
      (a, b) => a.concat(Array.isArray(b) ? Utils.flatten(b) : b), []
    );
  }

  static repeatText(text, repetition) {
    let out = '';
    for (let i = 0; i < repetition; i++) out = `${out}${text}`;
    return out;
  }

  //TODO: REVIEW
  static normalizeType(type){
    return ~type.indexOf('/')
      ? this._acceptParams(type)
      : { value: mime.lookup(type), params: {} };
  };

  static normalizeTypes(types){
    var ret = [];

    for (var i = 0; i < types.length; ++i) {
      ret.push(this.normalizeType(types[i]));
    }

    return ret;
  };

};
