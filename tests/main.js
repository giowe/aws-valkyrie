'usestrict'

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const lambdaJson = {};

app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('*', (req, res) =>{
  lambdaJson.headers = req.headers;
  lambdaJson.httpMethod = req.method;
  lambdaJson.body = req.body || null;
  lambdaJson.queryStringParameters = req.query || null;
  lambdaJson.path = req.params[0];
  res.send(lambdaJson);
});

app.listen(8080, () => {
  console.log('app listening on port 8080');
});

