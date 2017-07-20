'use strict';

const fs = require('fs');
const path = require('path');
const style = fs.readFileSync(path.join(__dirname, '/../templates/style.css'));
const pretty = require('js-object-pretty-print').pretty;

module.exports.htmlFormatter = (data) => {
  const { request, response } = data;
  const formattedRequest = `
    <h1>Request</h1>
    <table>
      <tr>
        <th>Method</th>
        <td>${request.method}</td>
      </tr>
      <tr>
        <th>URL</th>
        <td>${request.url}</td>
      </tr>
      <tr>
        <th>Headers</th>
        <td>${pretty(request.headers, 2)}</td>
      </tr>
      ${request.body ? `<tr>
        <th>Body</th>
        <td>${pretty(request.body, 2)}</td>
      </tr>` : ''}
    </table>
  `;

  const formattedResponse = `
    <h1>Response</h1>
    <table class="parent-table" style="text-align: left;">
      <tr>
        <th>Key</th>
        <th>Express</th>
        <th>Valkyrie</th>
      </tr>
      <tr>
        <th>Status</th>
        <td>${response.express.statusCode}</td>
        <td>${response.valkyrie.statusCode}</td>
      </tr>
      <tr>
        <th>Headers</th>
        <td>${pretty(response.express.headers, 2)}</td>
        <td>${pretty(response.valkyrie.headers, 2)}</td>
      </tr>
      <tr>
        <th>Body</th>
        <td>${response.express.headers['content-type'] === 'application/json; charset=utf-8' ? pretty(JSON.parse(response.express.body), 2) : response.express.body}</td>
        <td>${response.valkyrie.headers['content-type'] === 'application/json; charset=utf-8' ? pretty(JSON.parse(response.valkyrie.body), 2) : response.valkyrie.body}</td>
      </tr>`

  return `<style>${style}</style>\n<div class="container">${formattedRequest}\n${formattedResponse}</div>`;
}
