'use strict';

const express = require('express');
const valkyrie = require('../../lambda/valkyrie/valkyrie');

module.exports = (scenarioName) => new Promise((resolve, reject) => {
  let scenario;
  try {
    scenario = require(`../scenarios/${scenarioName}`);
  } catch (err) {
    return reject('Scenario', scenarioName, 'not found;');
  }
  const expressApp = scenario(express, 'express');
  const valkyrieApp = scenario(valkyrie, 'valkyrie');

  expressApp.listen(6000, () => {
    resolve({
      express: {
        app: expressApp,
        status: 'Express listening on port 6000'
      },
      valkyrie: {
        app: valkyrieApp,
        status: 'Valkyrie ready to be called',
        call: (event) => new Promise((resolve, reject) => {
          const _fail = (err) => reject(err);
          const _succeed = (data) => resolve(data);
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
            if (err) _fail(err);
            else _succeed(data);
          };

          valkyrieApp.listen(event, context, callback);
        })
      }
    });
  });
});
