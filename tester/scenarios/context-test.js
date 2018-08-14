/* eslint-disable no-console */
"use strict"
const rp = require("request-promise")

module.exports = (engine, engineName) => {
  const app = new engine()

  app.get("/", (req, res) => {
    rp({
      uri: "https://slack.com/api/api.test",
      json: true
    })
      .then(res.json)
      .catch(err => res.send(err))
  })

  return app
}
