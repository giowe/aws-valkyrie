/* eslint-disable no-console */
'use strict';

const clc = require('cli-color');
const gulp = require('gulp');
const data = require('gulp-data');
const filter = require('gulp-filter');
const rename = require('gulp-rename');
const zip = require('gulp-zip');
const usage = require('gulp-help-doc');
const install = require('gulp-install');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const AWS = require('aws-sdk');
const CwLogs = require('aws-cwlogs');
const argv = require('yargs').argv;
const tester = require('./tester/core/tester');

let lambdaConfig;
try {
  lambdaConfig = require(path.join(__dirname, 'lambda-config.json'));
} catch(err) {
  const allowedTasksWithoutConfigSet = ['configure', 'help', 'default'];
  if (process.argv[2] && allowedTasksWithoutConfigSet.indexOf(process.argv[2]) === -1) {
    console.log('WARNING! lambda config not found, run command', clc.cyan('gulp configure'));
    process.exit();
  }
  lambdaConfig = null;
}

/**
 * List all gulp tasks and their descriptions;
 * @task {help}
 * @order {0}
 */
gulp.task('help', function(){ return usage(gulp); });

gulp.task('default', ['help']);

/**
 * Set-up all settings of your AWS Lambda;
 * @task {configure}
 * @order {1}
 */
gulp.task('configure', function(next){
  inquirer.prompt([
    { type: 'input', name: 'FunctionName', message: 'Function name:', default: lambdaConfig? lambdaConfig.ConfigOptions.FunctionName:'my-lambda' },
    { type: 'input', name: 'Region', message: 'Region:',  default: lambdaConfig? lambdaConfig.Region:'eu-west-1' },
    { type: 'input', name: 'Description', message: 'Description:',  default: lambdaConfig? lambdaConfig.ConfigOptions.Description:null },
    { type: 'input', name: 'Role', message: 'Role arn:',  default: lambdaConfig? lambdaConfig.ConfigOptions.Role:null },
    { type: 'input', name: 'Handler', message: 'Handler:',  default: lambdaConfig? lambdaConfig.ConfigOptions.Handler:'index.handler' },
    { type: 'input', name: 'MemorySize', message: 'MemorySize:',  default: lambdaConfig? lambdaConfig.ConfigOptions.MemorySize:'128' },
    { type: 'input', name: 'Timeout', message: 'Timeout:',  default: lambdaConfig? lambdaConfig.ConfigOptions.Timeout:'3' },
    { type: 'input', name: 'Runtime', message: 'Runtime:',  default: lambdaConfig? lambdaConfig.ConfigOptions.Runtime:'nodejs6.10' }
  ])
    .then((config_answers) => {
      lambdaConfig = {
        Region: config_answers.Region,
        ConfigOptions: {
          FunctionName: config_answers.FunctionName,
          Description: config_answers.Description,
          Role: config_answers.Role,
          Handler: config_answers.Handler,
          MemorySize: config_answers.MemorySize,
          Timeout: config_answers.Timeout,
          Runtime: config_answers.Runtime
        }
      };
      const lambdaPackage = require(path.join(__dirname, 'lambda/package.json'));
      lambdaPackage.name = config_answers.FunctionName;
      lambdaPackage.description = config_answers.Description;
      fs.writeFileSync(path.join(__dirname, '/lambda/package.json'), JSON.stringify(lambdaPackage, null, 2));
      fs.writeFileSync(path.join(__dirname, '/lambda-config.json'), JSON.stringify(lambdaConfig, null, 2));
      console.log('\n', lambdaConfig, '\n\n', clc.green('Lambda configuration saved'));
      next();
    })
    .catch(console.log);
});

/**
 *  Installs npm packages inside the Valkyrie folder
 *  @task {install}
 *  @order {2}
 */
gulp.task('install', () => {
  return gulp.src(path.join(__dirname, 'lambda/Valkyrie/package.json'))
    .pipe(install());
});

/**
 *  Wraps everything inside the lambda folder in a zip file and uploads
 *  it to AWS to create your new AWS Lambda using the configuration
 *  information you set in the lambda_config.json file;
 *  @task {create}
 *  @order {3}
 */
gulp.task('create', (next) => {
  const f = filter('lambda/**', { restore: true });
  gulp.src(['./lambda/*', './Valkyrie/**' ], { dot: true, base: './' })
    .pipe(f)
    .pipe(rename(path => path.dirname = ''))
    .pipe(f.restore)
    .pipe(zip('lambda.zip'))
    .pipe(data(file => {
      const params = lambdaConfig.ConfigOptions;
      params.Code = { ZipFile: new Buffer(file.contents) };
      new AWS.Lambda({ region: lambdaConfig.Region }).createFunction(params, (err, data) => {
        if (err){
          console.log(clc.red('FAILED'), '-', clc.red(err.message));
          console.log(err);
        } else {
          console.log(clc.green('SUCCESS'), '- lambda', clc.cyan(data.FunctionName), 'created');
          console.log(data);
        }
        next();
      });
    }));
});

/**
 *  Wraps everything inside the lambda folder in a zip file and uploads
 *  it to AWS to update your existing AWS Lambda using the configuration
 *  information you set in the lambda-config.json file;
 *  @task {update}
 *  @order {4}
 */
gulp.task('update', ['update-config', 'update-code']);

/**
 *  Wraps everything inside the lambda folder in a zip file and uploads
 *  it to AWS to update the code of your existing AWS Lambda;
 *  @task {update-code}
 *  @order {5}
 */
gulp.task('update-code', (next) => {
  const f = filter('lambda/**', { restore: true });
  gulp.src(['./lambda/*', './Valkyrie/**' ], { dot: true, base: './' })
    .pipe(f)
    .pipe(rename(path => path.dirname = ''))
    .pipe(f.restore)
    .pipe(zip('lambda.zip'))
    .pipe(data(file => {
      new AWS.Lambda({ region: lambdaConfig.Region }).updateFunctionCode({
        FunctionName: lambdaConfig.ConfigOptions.FunctionName,
        ZipFile: new Buffer(file.contents)
      }, (err, data) => {
        if (err){
          console.log(clc.red('FAILED'), '-', clc.red(err.message));
          console.log(err);
        } else {
          console.log(clc.green('SUCCESS'), '- lambda', clc.cyan(data.FunctionName), 'code updated');
          console.log(data);
        }
        next();
      });
    }));
});

/**
 *  Changes your AWS Lambda configuration using the information
 *  you set in the lambda-config.json file;
 *  @task {update-config}
 *  @order {6}
 */
gulp.task('update-config', (next) => {
  new AWS.Lambda({ region: lambdaConfig.Region }).updateFunctionConfiguration(lambdaConfig.ConfigOptions, function(err, data) {
    if (err){
      console.log(clc.red('FAILED'), '-', clc.red(err.message));
      console.log(err);
    }
    else {
      console.log(clc.green('SUCCESS'), '- lambda', clc.cyan(data.FunctionName), 'config updated');
      console.log(data);
    }
    next();
  });
});

/**
 *  Deletes your AWS Lambda function;
 *  @task {update-config}
 *  @order {7}
 */
gulp.task('delete', (next) => {
  const lambda = new AWS.Lambda({ region: lambdaConfig.Region });
  lambda.deleteFunction({ FunctionName: lambdaConfig.ConfigOptions.FunctionName }, function(err) {
    if (err){
      console.log(clc.red('FAILED'), '-', clc.red(err.message));
      console.log(err);
    }
    else console.log(clc.green('SUCCESS'), '- lambda deleted');

    next();
  });
});

/**
 *  Prints in the console all logs generated by you Lambda
 *  function in Amazon CloudWatch;
 *  @task {logs}
 *  @order {8}
 */
gulp.task('logs', () => {
  const cwlogs = new CwLogs({
    logGroupName:`/aws/lambda/${lambdaConfig.ConfigOptions.FunctionName}`,
    region: lambdaConfig.Region,
    momentTimeFormat: 'hh:mm:ss:SSS',
    logFormat: 'lambda'
  });

  cwlogs.start();
});

/**
 * Invokes the Lambda function passing tests-payload.js as
 * payload and printing the response to the console;
 * @task {invoke}
 * @order {9}
 */
gulp.task('invoke', (next) => {
  const lambda = new AWS.Lambda({ region: lambdaConfig.Region });

  let payload;
  try {
    payload = JSON.stringify(require('./test-payload.js')(argv.path || argv.p, argv.method || argv.m));
  } catch(err) {
    payload = null;
  }

  lambda.invoke({
    FunctionName: lambdaConfig.ConfigOptions.FunctionName,
    InvocationType: 'RequestResponse',
    LogType: 'None',
    Payload: payload
  }, (err, data) => {
    if (err) return console.log(err, err.routeStack);
    try {
      console.log(JSON.parse(data.Payload));
    } catch (err) {
      console.log(data.Payload);
    }
    next();
  });
});

/**
 * Invokes the Lambda function LOCALLY passing tests-payload.js
 * as payload and printing the response to the console;
 * @task {invoke-local}
 * @order {10}
 */
gulp.task('invoke-local', (next) => {
  process.env.NODE_ENV = 'local';
  require('./test-local')(next);
});

/**
 * Sets up both a Valkyrie and an Express app with the same template called scenario;
 * then another Express app proxies all the requests to them.
 * The responses are returned for further comparisons;
 * @task {start-scenario}
 * @order {11}
 */
gulp.task('start-scenario', (next) => {
  checkScenario(argv.s || argv.scenario)
    .then(scenarioName => {
      tester.startScenario(scenarioName)
        .then(data => {
          console.log(data.scenario.status);
          console.log(data.express.status);
          console.log(data.valkyrie.status);
          next();
        })
        .catch((err) => {
          console.log(err);
          next();
        });
    });
});

const checkScenario = (scenarioName) => new Promise((resolve, reject) => {
  const scenarios = fs.readdirSync('./tester/scenarios/').map(file => path.basename(file, '.js'));
  if (!scenarioName) {
    inquirer.prompt({ type: 'list', name: 'scenario', message: 'Please specify one of the following scenarios to be initialized:', choices: scenarios })
      .then(answer => resolve(answer.scenario))
      .catch(reject);
  } else if(scenarios.indexOf(scenarioName) === -1){
    console.log(`Scenario "${scenarioName}" doesn't exist!`);
    checkScenario()
      .then(resolve)
      .catch(reject);
  }
  else resolve(scenarioName);
});

/**
 * Sends a request, created following a specified template called test,
 * to the Express app, before sending the request it assures that a
 * scenario is active and running, if not it starts one selected by the user
 * and saves the response in files in the outputs directory;
 */
gulp.task('start-test', (next) => {
  checkTest(argv.t || argv.test)
    .then(testName => {
      tester.startTest(testName, argv.s || argv.scenario)
        .then(data => console.log(data))
        .catch((err) => {
          err.message === 'Missing scenario name' ? checkScenario() : console.log(err);
          next();
        });
    });
});

const checkTest = (testName) => new Promise((resolve, reject) => {
  const tests = fs.readdirSync('./tester/tests/').map(file => path.basename(file, '.json'));
  if (!testName) {
    inquirer.prompt({ type: 'list', name: 'test', message: 'Please specify one of the following tests to be initialized:', choices: tests })
      .then(answer => resolve(answer.test))
      .catch(reject);
  } else if(tests.indexOf(testName === -1)){
    console.log(`Test "${testName}" doesn't exist!`);
    checkTest()
      .then(resolve)
      .catch(reject);
  }
  else resolve(testName);
});
