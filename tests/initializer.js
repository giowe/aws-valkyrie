'use strict';

const express = require('express');
const valkyrie = require('../lambda/valkyrie');

const test = require('./test1');
const expressTest = test(express);
const valkyrieTest = test(valkyrie);

expressTest.listen(6000, () => console.log('test listening on port 6000'));

module.exports = (event) => new Promise((resolve, reject) => {
  const _fail = (err) => {
    console.log({ errorMessage: err });
    reject(err);
  };

  const _succeed = (data) => {
    console.log(data.headers);
    resolve(data);
  };

  const _done = (err, data) => {
    if (err) _fail(err);
    else _succeed(data);
  };

  const context = {
    fail: _fail,
    succeed: _succeed,
    done: _done
  };

  const callback = (err, data) => {
    if (err) return _fail(err);
    _succeed(data);
  };

  valkyrieTest.listen(event, context, callback);
});
