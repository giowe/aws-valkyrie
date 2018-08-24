/* eslint-disable no-console */

const gulp = require("gulp")
const usage = require("gulp-help-doc")
const install = require("gulp-install")
const fs = require("fs")
const path = require("path")
const inquirer = require("inquirer")
const argv = require("simple-argv")
const tester = require("./tester/core/tester")

/**
 * List all gulp tasks and their descriptions;
 * @task {help}
 * @order {0}
 */
gulp.task("help", function(){ return usage(gulp) })

gulp.task("default", ["help"])

/**
 *  Installs npm packages inside the Valkyrie folder
 *  @task {install}
 *  @order {1}
 */
gulp.task("install", () => {
  return gulp.src(path.join(__dirname, "lambda/Valkyrie/package.json"))
    .pipe(install())
})


/**
 * Sets up a Valkyrie and an Express app with the same template called scenario;
 * then another Express app proxies all the requests to them.
 * The responses are returned for further comparisons;
 * @task {start-scenario}
 * @order {11}
 */
gulp.task("start-scenario", (next) => {
  checkScenario(argv.s || argv.scenario)
    .then(scenarioName => {
      tester.startScenario(scenarioName)
        .then(() => next())
        .catch(next)
    })
})

const checkScenario = (scenarioName) => new Promise((resolve, reject) => {
  const scenarios = fs.readdirSync("./tester/scenarios/").map(file => path.basename(file, ".js"))
  if (!scenarioName) {
    inquirer.prompt({ type: "list", name: "scenario", message: "Please specify one of the following scenarios to be initialized:", choices: scenarios })
      .then(answer => resolve(answer.scenario))
      .catch(reject)
  } else if(scenarios.indexOf(scenarioName) === -1){
    console.log(`Scenario "${scenarioName}" doesn't exist!`)
    checkScenario()
      .then(resolve)
      .catch(reject)
  }
  else resolve(scenarioName)
})

/**
 * Sends a request, created following a specified template called test,
 * to the Express app, before sending the request it assures that a
 * scenario is active and running, if not it starts one selected by the user
 * and saves the response in files in the outputs directory;
 */
gulp.task("start-test", (next) => {
  checkTest(argv.t || argv.test)
    .then(testName => {
      tester.startTest(testName, argv.s || argv.scenario)
        .then(data => console.log(data))
        .catch((err) => {
          err.message === "Missing scenario name" ? checkScenario() : console.log(err)
          next()
        })
    })
})

const checkTest = (testName) => new Promise((resolve, reject) => {
  const tests = fs.readdirSync("./tester/tests/").map(file => path.basename(file, ".json"))
  if (!testName) {
    inquirer.prompt({ type: "list", name: "test", message: "Please specify one of the following tests to be initialized:", choices: tests })
      .then(answer => resolve(answer.test))
      .catch(reject)
  } else if(tests.indexOf(testName === -1)){
    console.log(`Test "${testName}" doesn't exist!`)
    checkTest()
      .then(resolve)
      .catch(reject)
  }
  else resolve(testName)
})
