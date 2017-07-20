/* eslint-disable no-console */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const fs = require('fs');
const path = require('path');
const pretty = require('js-object-pretty-print').pretty;

const { htmlFormatter } = require('./formatter');

const startScenario = (scenarioName) => new Promise((resolve, reject) => {
  if (!scenarioName) return reject(new Error('Missing scenario name'));
  require('./initializer')(scenarioName)
    .then(scenario => {
      const app = new express();

      app.use(bodyParser.json(), bodyParser.raw(), bodyParser.text(), bodyParser.urlencoded({ extended: false }));
      app.get('/scenario', (req, res) => res.json({ scenarioName }));
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
                request:{
                  method : response.request.method,
                  url : response.request.uri.href,
                  headers : response.request.headers
                },
                response:{
                  statusCode: response.statusCode,
                  headers:response.headers,
                  body
                }
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
            res.header('json-format-response', JSON.stringify(Object.assign({}, { request: data[0].request, response: { express: data[0].response, valkyrie: data[1] } })));
            res.send(htmlFormatter(Object.assign({}, { request: data[0].request, response: { express: data[0].response, valkyrie: data[1] } })));
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

const startTest = (testName, scenarioName) => new Promise((resolve, reject) => {
  if (!testName) return reject(new Error('Missing test name'));
  let test;
  try {
    test = require(`../tests/${testName}`);
  } catch (err) {
    return reject(`Test "${testName}" not found;`);
  }
  getCurrentScenario()
    .then((data) => {
      if(data && data.scenarioName !== scenarioName) {
        console.log(`Running on scenario "${data.scenarioName}" unless than on "${scenarioName}" as specified.\nIf you want it to run on the designed scenario stop the one running currently`);
      } else if(!data) return startScenario(scenarioName || test.scenario)
        .then(data =>{
          console.log(data.scenario.status);
          console.log(data.express.status);
          console.log(data.valkyrie.status);
        });
    })
    .then(() => {
      request(test, (error, response, body) => {
        if(error) return error;
        try { fs.mkdirSync(path.join(__dirname, '../outputs')); } catch(ignore) {}
        const jsonFormat = pretty(JSON.parse(response.headers['json-format-response']));
        fs.writeFileSync(path.join(__dirname, '../outputs/test.html'), body);
        fs.writeFileSync(path.join(__dirname, '../outputs/test.json'), jsonFormat);
        resolve(jsonFormat);
      });
    })
    .catch(reject);
});

const getCurrentScenario = () => new Promise((resolve, reject) => {
  request('http://localhost:8080/scenario', (error, response, body) => {
    if(body) return resolve(JSON.parse(body));
    if(error.code === 'ECONNREFUSED') return resolve(null);
    reject(error);
  });
});


module.exports = { startScenario, startTest };
