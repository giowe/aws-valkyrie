/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  app.get('/', (req, res, next) => {
    throw new Error('test error');
  });

  app.get('/no-error', (req, res) => res.send('no errors'));

  app.use((err, req, res, next) => {
    res.header('error-handled', true);
    throw new Error('second error');
  });

  app.use((req, res, next) => {
    res.header('no-errors-middleware', true);
    console.log(engineName, 'middleware for no errors');
    next();
  });

  app.use((err, req, res, next) => {
    res.send('Second error handled');
  });

  app.get('/no-error2', (req, res) => res.send('no errors2'));

  return app;
};
