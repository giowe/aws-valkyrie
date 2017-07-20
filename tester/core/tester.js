/* eslint-disable no-console */
'use strict';

module.exports.startScenario = (scenarioName) => new Promise((resolve, reject) => {
  if (!scenarioName) return reject('You must specify a scenario name using flags -s, --scenario or writing it in the test file at "scenario" key;');

  const bodyParser = require('body-parser');
  const express = require('express');
  const app = express();
  const callLambda = require('./initializer')(scenarioName);
  const request = require('request');
  const { htmlFormatter, jsonFormatter } = require('./formatter');

  app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({ extended: false }));

  app.use('*', (req, res) => {
    delete req.headers['tests-format'];

    const { headers, method, body, query, params, originalUrl } = req;
    const event = {
      headers: req.headers,
      httpMethod: req.method,
      body: req.body,
      queryStringParams: req.query,
      path: req.params[0]
    };

    Promise.all([
      new Promise((resolve, reject) => {
        request({
          url: `http://localhost:6000${originalUrl}`,
          method,
          headers
        }, (error, response, body) => {
          if (error) return reject(error);
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body
          });
        });
      }),
      callLambda(event)
    ])
      .then(data => {
        //todo salvare files
        res.send(htmlFormatter(data));
      })
      .catch(res.send);
  });

  app.listen(8080, () => {
    resolve(`${scenarioName} is listening on port 8080`);
  });
});

