'use strict';

const fs = require('fs');
const path = require('path');
const style = fs.readFileSync(path.join(__dirname, '/../templates/style.css'));
const pretty = require('js-object-pretty-print').pretty;

const getContentType = (headers) => (headers['content-type'] || headers['Content-Type']);

const statusColor = (statusCode) => {
  switch (statusCode.toString()[0]) {
    case '2':
      return 'green';
    case '3':
      return 'blue';
    case '4':
      return 'yellow';
    case '5':
      return 'red';
    default:
      return 'black';
  }
};

module.exports.htmlFormatter = (data) => {
  const { request, response } = data;
  const formattedRequest = `
    <h1>Request</h1>
    <table>
      <col style="width: 10vw" />
      <col style="width: 50vw" />
      <tr>
        <th>Method</th>
        <td style="font-weight: bold;">${request.method}</td>
      </tr>
      <tr>
        <th>URL</th>
        <td><a href="${request.url}" target="_blank">${request.url}</a></td>
      </tr>
      <tr>
        <th>Headers</th>
        <td class="jsonViewerReq">${pretty(request.headers, 2)}</td>
      </tr>
      ${request.body ? `<tr>
        <th>Body</th>
        <td class="jsonViewerReq">${pretty(request.body, 2)}</td>
      </tr>` : ''}
    </table>
  `;

  const formattedResponse = `
    <h1>Response</h1>
    <table class="parent-table" style="text-align: left;">
    <col style="width: 10vw" />
    <col style="width: 25vw" />
    <col style="width: 25vw" />
      <tr>
        <th>Key</th>
        <th>Express</th>
        <th>Valkyrie</th>
      </tr>
      <tr>
        <th>Status</th>
        <td style="color: ${statusColor(response.express.statusCode)}; font-weight: bold;">${response.express.statusCode}</td>
        <td style="color: ${statusColor(response.express.statusCode)}; font-weight: bold;">${response.valkyrie.statusCode}</td>
      </tr>
      <tr>
        <th>Headers</th>
        <td class="jsonViewerRes">${pretty(response.express.headers, 2)}</td>
        <td class="jsonViewerRes">${pretty(response.valkyrie.headers, 2)}</td>
      </tr>
      ${response.express.body && response.valkyrie.body ? `<tr>
        <th>Body</th>
        <td class="jsonViewerRes">${getContentType(response.express.headers) && getContentType(response.express.headers).includes('application/json') ? pretty(JSON.parse(response.express.body), 2) : response.express.body}</td>
        <td class="jsonViewerRes">${getContentType(response.express.headers) && getContentType(response.express.headers).includes('application/json') ? pretty(JSON.parse(response.express.body), 2) : response.express.body}</td>
      </tr>` : ''}
      `;

  return `<script>console.log(\`${pretty(data)}\`);</script><style>${style}</style>\n<div class="container">${formattedRequest}\n${formattedResponse}</div>`;
};
