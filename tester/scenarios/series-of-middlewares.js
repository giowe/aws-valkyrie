/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();

  const r1 = engine.Router();
  r1.get('/', (req, res, next) => {
    res.header('r1', true);
    next();
  });

  const r2 = engine.Router();
  r2.get('/', (req, res, next) => {
    res.header('r2', true);
    next();
  });

  app.use(r1, r2);

  if (engineName === 'valkyrie') console.log(app.describe());

  return app;
};
