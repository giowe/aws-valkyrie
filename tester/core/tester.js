/* eslint-disable no-console */
'use strict';

module.exports.startScenario = (scenarioName) => new Promise((resolve, reject) => {
  if (!scenarioName) return reject('You must specify a scenario name using flags -s, --scenario or writing it in the test file at "scenario" key;');
  require('./initializer')(scenarioName)
    .then(scenario => {
      const bodyParser = require('body-parser');
      const express = require('express');
      const request = require('request');
      const { htmlFormatter, jsonFormatter } = require('./formatter');
      const app = new express();

      app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({ extended: false }));

      app.all('*', (req, res) => {
        const { headers, method, body, query, params, originalUrl } = req;
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
          scenario.valkyrie.call({
            headers,
            httpMethod: method,
            body,
            queryStringParams: query,
            path: params[0]
          })
        ])
          .then(data => {
            //todo salvare files
            res.send(htmlFormatter(data));
          })
          //todo gestire i fallimenti in modo chiaro
          .catch(res.send);
      });

      app.listen(8080, () => resolve({
        express: scenario.express,
        valkyrie: scenario.valkyrie,
        scenario: {
          app,
          status: `${scenarioName} is listening on port 8080`
        }
      }));
    })
    .catch(reject);
});
