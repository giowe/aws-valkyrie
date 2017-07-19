/* eslint-disable no-console */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const callLambda = require('./initializer');
const request = require('request');

app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({ extended: false }));

app.use('*', (req, res) => {
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
      res.send(html(data));
    })
    .catch(res.send);
});

app.listen(8080, () => console.log('app listening on port 8080'));

function html(data) {
  return `
<table style="width:100%">
  <tr>
    <th>Key</th>
    <th>Express</th>
    <th>Valkyrie</th>
  </tr>
    ${ Object.keys(data[0]).map(key => `<tr><td>${key}</td><td>${parseValue(data[0][key])}</td><td>${parseValue(data[1][key])}</td></tr>`).join('') }
</table>`;
}

function parseValue(value) {
  if(typeof value !== 'object') return value;
  return `<table> ${ Object.entries(value).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')} </table>`;
}
