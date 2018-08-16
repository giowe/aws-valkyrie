const express = require("express")
const valkyrie = require("../../Valkyrie/Valkyrie")
const utils = require("./utils")
const formatter = require("express2apigateway")
/**
 * Sets up both a Valkyrie and an Express app with the same template called scenario;
 * @param scenarioName
 */

module.exports = (scenarioName) => new Promise((resolve, reject) => {
  let scenario
  try {
    scenario = require(`../scenarios/${scenarioName}`)
  } catch (err) {
    return reject(`Scenario "${scenarioName}" not found;`)
  }
  const expressApp = scenario(express, "express", utils("express"))
  const valkyrieApp = scenario(valkyrie, "valkyrie", utils("valkyrie"))

  expressApp.listen(8888, () => {
    const call = (event) => new Promise((resolve, reject) => {
      const _fail = (err) => reject(err)
      const _succeed = (data) => resolve(data)
      const _done = (err, data) => {
        if (err) _fail(err)
        else _succeed(data)
      }
      const context = {
        fail: _fail,
        succeed: _succeed,
        done: _done
      }
      const callback = (err, data) => {
        if (err) _fail(err)
        else _succeed(data)
      }

      valkyrieApp.listen(event, context, callback)
    })

    const expressWrapper = new express()
    expressWrapper.listen(9999)

    expressWrapper.all("*", (req, res) => {
      call(formatter(req))
        .then(({ statusCode, headers, body }) => {
          Object.entries(headers).forEach(([key, value]) => {
            res.set(key, value)
          })
          res.status(statusCode).send(body)
        })
        .catch(err => res.send(err))
    })

    resolve({
      express: {
        app: expressApp,
        status: "Express listening on port 8888"
      },
      valkyrie: {
        app: valkyrieApp,
        expressWrapper,
        status: "Valkyrie listening on port 9999",
        call
      }
    })
  })
})
