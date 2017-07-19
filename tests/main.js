/* eslint-disable no-console */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const callLambda = require('./initializer');

app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({ extended: false }));

app.use('*', (req, res) => {
  const event = {
    headers: req.headers,
    httpMethod: req.method,
    body: req.body,
    queryStringParams: req.query,
    path: req.params[0]
  };

  callLambda(event)
    .then(data => {
      Object.entries(data.headers).forEach(([key, value]) => res.set(key, value));
      res.status(data.statusCode).send(data.body);
    })
    .catch(res.send);
});

app.listen(8080, () => console.log('app listening on port 8080'));
