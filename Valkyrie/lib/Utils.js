const mime = require('mime');
const contentType = require('content-type');
const etag = require('etag');

function _acceptParams(str, index) {
  const parts = str.split(/ *; */);
  const ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

  ret.forEach(e => {
    const pms = e.split(/ *= */);
    if ('q' === pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      ret.params[pms[0]] = pms[1];
    }
  });

  return ret;
}

module.exports = class Utils {
  static setCharset(type, charset) {
    if (!type || !charset) {
      return type;
    }
    const parsed = contentType.parse(type);
    parsed.parameters.charset = charset;
    return contentType.format(parsed);
  }

  static stringify(entity, replacer, spaces) {
    if (typeof entity === 'object') {
      try {
        const cache = [];

        return JSON.stringify(entity, replacer || ((key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) return '[Circular]';
            cache.push(value);
          }
          return value;
        }), spaces);
      } catch (err) {
        return String(entity);
      }
    }

    return String(entity);
  }

  static flatten(array) {
    if (!array) return [];
    return array.reduce(
      (a, b) => a.concat(Array.isArray(b) ? Utils.flatten(b) : b), []
    );
  }

  static normalizeType(type) {
    return ~type.indexOf('/') ?
      _acceptParams(type) :
      { value: mime.getType(type), params: {} };
  }

  static etag(body, encoding) {
    const buf = !Buffer.isBuffer(body) ? new Buffer(body, encoding) : body;
    return etag(buf, { weak: false });
  }

  static wetag(body, encoding) {
    const buf = !Buffer.isBuffer(body) ? new Buffer(body, encoding) : body;
    return etag(buf, { weak: true });
  }

  static compileETag(val) {
    let fn;

    if (typeof val === 'function') {
      return val;
    }

    switch (val) {
      case true:
        fn = Utils.wetag;
        break;
      case false:
        break;
      case 'strong':
        fn = Utils.etag;
        break;
      case 'weak':
        fn = Utils.wetag;
        break;
      default:
        throw new TypeError(`unknown value for etag function: ${val}`);
    }

    return fn;
  }
};
