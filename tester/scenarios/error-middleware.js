/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  app.get('/', (req, res, next) => {
    next();
  });

  app.use((err, req, res, next) => {
    res.send(err.message);
  });

  return app;
};
