/* eslint-disable no-console */
'use strict';
const clc  = require('cli-color');
const path = require('path');
const argv = require('yargs').argv;

module.exports = function(next){
  let lambda_config;
  try {
    lambda_config = require(path.join(__dirname, 'lambda-config.json'));
  } catch (err) {
    return console.log('WARNING! lambda config not found, run command', clc.cyan('gulp configure'));
  }

  let payload;
  try {
    payload = require('./test-payload.js')(argv.path || argv.p, argv.method || argv.m);
  } catch (err) {
    return console.log('WARNING! "test-payload.js" not found!');
  }

  const _fail = function(err) {
    console.log({ errorMessage: err });
    next();
    process.exit();
  };

  const _succeed = function(data) {
    if(data) console.log(data);
    next();
    process.exit();
  };

  const _done = function(err, data) {
    if (err) _fail(err);
    else _succeed(data);
    next();
    process.exit();
  };

  const context = {
    fail:    _fail,
    succeed: _succeed,
    done:    _done
  };

  const callback = function(err, data) {
    if (err) return _fail(err);
    _succeed(data);
  };

  const handler = lambda_config.ConfigOptions.Handler.split('.');
  const lambda = require(path.join(__dirname, 'lambda', handler[0]))[handler[1]];

  lambda(payload, context, callback);
};
