/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  app.get('/', (req, res, next) => {
    throw new Error('test error');
  });

  return app;
};
