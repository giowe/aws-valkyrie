/* eslint-disable no-console */
'use strict';

module.exports = (scenario) => {
  const bodyParser = require('body-parser');
  const express = require('express');
  const app = express();
  const callLambda = require('./initializer')(scenario);
  const request = require('request');
  const {htmlFormatter, jsonFormatter} = require('./formatter');

  app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({extended: false}));

  app.use('*', (req, res) => {
    const testFormat = req.headers['tests-format'] || 'json';
    delete req.headers['tests-format'];

    const promeses = [];
    const event = {
      headers: req.headers,
      httpMethod: req.method,
      body: req.body,
      queryStringParams: req.query,
      path: req.params[0]
    };
    const options = {
      url: `http://localhost:6000${req.originalUrl}`,
      method: event.httpMethod,
      headers: event.headers
    };
    promeses.push(new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) return reject(error);
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body
        });
      });
    }));
    promeses.push(callLambda(event));
    Promise.all(promeses)
      .then(data => {
        res.send(htmlFormatter(data));
      })
      .catch(res.send);
  });

  app.listen(8080, () => console.log('app listening on port 8080'));
};

