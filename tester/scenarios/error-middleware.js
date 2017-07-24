/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  app.get('/', (req, res, next) => {
    throw new Error('test error');
  });

  app.get('/no-error', (req, res) => res.send('no errors'));

  app.use((err, req, res, next) => {
    console.log(engineName, 'error handled');
    res.send('error handled');
  });

  app.get('/no-error2', (req, res) => res.send('no errors2'));

  return app;
};
