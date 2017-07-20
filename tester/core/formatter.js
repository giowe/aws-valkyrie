'use strict';

const fs = require('fs');
const path = require('path')
const style = fs.readFileSync(path.join(__dirname, '/templates/style.css'));

module.exports.htmlFormatter = (data) => {
  return `
    <div style="width: 50%">
    <table class="nested-table">
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
  return `<style>${style}</style><table class="parent-table"> ${ Object.entries(value).map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`).join('')} </table>`;
}

