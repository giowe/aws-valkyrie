'use strict';

let _started = false;
module.exports = class State {
  static get started() { return _started; }
  static set started(value) { _started = value; }
};
