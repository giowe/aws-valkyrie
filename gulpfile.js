'use strict';

const request = require('request');
const clc = require('cli-color');
const zipdir = require('zip-dir');
const gulp = require('gulp');
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
  ]).then((config_answers) => {
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
  zipdir(path.join(__dirname, 'lambda'), function (err, buffer) {
    if (err) return console.log(clc.red('FAILED'), '-', clc.red(err));
    const params = lambdaConfig.ConfigOptions;
    params.Code = { ZipFile: buffer };

    new AWS.Lambda({ region: lambdaConfig.Region }).createFunction(params, (err, data) => {
      if (err){
        console.log(clc.red('FAILED'), '-', clc.red(err.message));
        console.log(err);
      }
      else console.log(clc.green('SUCCESS'), '- lambda', clc.cyan(data.FunctionName), 'created');
      next();
    });
  });
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
  zipdir(path.join(__dirname, 'lambda'), function (err, buffer) {
    if (err) return console.log(clc.red('FAILED'), '-', clc.red(err));

    new AWS.Lambda({ region: lambdaConfig.Region }).updateFunctionCode({
      FunctionName: lambdaConfig.ConfigOptions.FunctionName,
      ZipFile: buffer
    }, (err, data) => {
      if (err){
        console.log(clc.red('FAILED'), '-', clc.red(err.message));
        console.log(err);
      }
      else {
        console.log(clc.green('SUCCESS'), '- lambda', clc.cyan(data.FunctionName), 'code updated');
        console.log(data);
      }
      next();
    });
  });
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

gulp.task('start-scenario', () => {
  tester.startScenario(argv.s || argv.scenario)
    .then(data => {
      console.log(data.scenario.status);
      console.log(data.express.status);
      console.log(data.valkyrie.status);
    })
    .catch(console.log);
});

gulp.task('test', (next) => {
  const testName = argv.t || argv.test;
  const test = require(`./tester/tests/${testName}`);
  tester.startScenario(test.scenario || argv.s || argv.scenario);

  request(test, (error, results) => {
    if(error) console.log(error);
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
