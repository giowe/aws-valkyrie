const express = require("express")
const valkyrie = require("../../Valkyrie/Valkyrie")
const utils = require("./utils")
const apigatewayProxyLocal = require("aws-apigateway-proxy-local")
//const formatter = require("express2apigateway")
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

  const expressPort = 9999
  const valkyriePort = 8888

  Promise.all([
    new Promise(resolve => {
      expressApp.listen(expressPort, () => {
        console.log(`Express listening on port ${expressPort}`)
        resolve()
      })
    }),

    new Promise(resolve => {
      apigatewayProxyLocal((...args) => valkyrieApp.listen(...args), {
        port: valkyriePort,
        listeningMessage: `Valkyrie listening on port ${valkyriePort}`
      })
      resolve()
    })
  ])
    .then(() => {
      resolve({
        express: {
          app: expressApp
        },
        valkyrie: {
          app: valkyrieApp
        }
      })
    })
    .catch(reject)
})
