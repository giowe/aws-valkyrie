/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  const r1 = engine.Router();
  r1.get('/', (req, res, next) => {
    console.log(engineName, 'r1');
    next();
  });

  const r2 = engine.Router();
  r2.get('/', (req, res, next) => {
    console.log(engineName, 'r2');
    next();
  });

  app.use(r1, r2);

  app.get('/', (req, res) => {
    res.send('catch');
  });
  return app;
};
