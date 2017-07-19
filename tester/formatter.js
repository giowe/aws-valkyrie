'use strict';

module.exports.htmlFormatter = (data) => {
  return `
    <style>
      body {
        font-family: monospace;
        padding: 0;
        border: 0;
        outline: 0;
        display: block;
        text-align: center;
      }
      table {
        margin-bottom: 20px;
        margin-right: 20vw;
        margin-left: 20vw;
        table-layout: auto;
        border-collapse: collapse;
      }
      
      table, th, td {
        border: 1px solid black;
        border-bottom-left-radius: 3px;
        border-bottom-right-radius: 3px;
      }
    </style>
    <div style="width: 50%">
    <table>
      <tr>
        <th>Key</th>
        <th>Express</th>
        <th>Valkyrie</th>
      </tr>
        ${ Object.keys(data[0]).map(key => `<tr><td>${key}</td><td>${parseValue(data[0][key])}</td><td>${parseValue(data[1][key])}</td></tr>`).join('') }
    </table>
    </div>`;
};

function parseValue(value) {
  if (typeof value !== 'object') return value;
  return `<table> ${ Object.entries(value).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')} </table>`;
}

