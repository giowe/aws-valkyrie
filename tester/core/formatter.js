const fs = require("fs")
const path = require("path")
const style = fs.readFileSync(path.join(__dirname, "./style.css"))
const pretty = require("js-object-pretty-print").pretty

const getContentType = (headers) => (headers["content-type"] || headers["Content-Type"])

const statusColor = statusCode => {
  switch (statusCode.toString()[0]) {
    case "2": return "limegreen"
    case "3": return "blue"
    case "4": return "orange"
    case "5": return "red"
    default: return "black"
  }
}

module.exports.htmlFormatter = data => {
  const { request, response: { express, valkyrie } } = data

  const html = [
    "<!DOCTYPE html><html><head><title>Valkyrie Tester</title><meta charset=\"UTF-8\"></head><body>",
    `<script>console.log(\`${pretty(data)}\`);</script>`,
    `<style>${style}</style>`,
    "<div class=\"container\">",

    "</table>",
    "<h1>Response</h1>",
    "<table class=\"parent-table\" style=\"text-align: left;\">",
    "<col style=\"width: 10vw\" />",
    "<col style=\"width: 25vw\" />",
    "<col style=\"width: 25vw\" />",
    "<tr><th>Key</th><th>Express</th><th>Valkyrie</th></tr>"
  ]

  Object.entries(express).forEach(([key, value]) => {
    const valueValkyrie = valkyrie[key]
    if(value || valueValkyrie) {
      html.push(`<tr><th>${key}</th>`)
    }
    if (value) {
      html.push(`
        <td ${typeof value === "object" ? "class=\"jsonViewerRes\"" : ""}`)
      if (key === "statusCode") html.push (` style="color: ${statusColor(value)}"`)
      if (key === "body") html.push(" style=\"overflow-x: scroll\"")
      if (key === "headers" || (key === "body" &&
        getContentType(express.headers) && getContentType(express.headers).includes("application/json"))) {
        html.push(`>${(typeof value === "object" ? pretty(value, 2) : pretty(JSON.parse(value), 2)).replace(/</g, "&lt;").replace(/>/g, "&gt;")}`)
      } else {
        html.push(`>${value.toString().replace(/[\u00A0-\u9999<>&]/gim, (i) => {
          return "&#" + i.charCodeAt(0) + ";"
        })}`)
      }
      html.push("</td>")
    }
    if (valueValkyrie) {
      html.push(`
        <td ${typeof valueValkyrie === "object" ? "class=\"jsonViewerRes\"" : ""}`)
      if (key === "statusCode") html.push(` style="color: ${statusColor(valueValkyrie)}"`)
      if (key === "body") html.push(" style=\"overflow-x: scroll\"")
      if (key === "headers" || (key === "body" &&
        getContentType(valkyrie.headers) && getContentType(valkyrie.headers).includes("application/json"))) {
        html.push(`>${(typeof valueValkyrie === "object" ? pretty(valueValkyrie, 2) : pretty(JSON.parse(valueValkyrie), 2)).replace(/</g, "&lt;").replace(/>/g, "&gt;")}`)
      } else {
        html.push(`>${valueValkyrie.toString().replace(/[\u00A0-\u9999<>&]/gim, (i) => {
          return `&#${i.charCodeAt(0)};`
        })}`)
      }
      html.push("</td>")
    }
    if(value || valueValkyrie) {
      html.push("</tr>")
    }
  })

  html.push("</table>")

  html.push(
    "<h1>Request</h1>",
    "<table>",
    "<col style=\"width: 10vw\" /><col style=\"width: 50vw\" />",
    ...Object.entries(request).map(([key, value]) => !value ? "" : `<tr><th>${key}</th><td ${typeof value === "object" ? "class=\"jsonViewerReq\"" : ""}>${typeof value === "object" ? pretty(value, 2) : value}</td></tr>`),
    "</table></div></html></body>"
  )

  return html.join("")
}
