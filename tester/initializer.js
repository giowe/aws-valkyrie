'use strict';

const express = require('express');
const valkyrie = require('../lambda/valkyrie');

module.exports = (scenario) => {
  const expressTest = scenario(express);
  const valkyrieTest = scenario(valkyrie);

  expressTest.listen(6000, () => console.log('scenario listening on port 6000'));

  return module.exports = (event) => new Promise((resolve, reject) => {
    const _fail = (err) => {
      console.log({ errorMessage: err });
      reject(err);
    };

    const _succeed = (data) => {
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
    return valkyrieTest.listen(event, context, callback);
  });
};
