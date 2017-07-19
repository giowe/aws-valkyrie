/* eslint-disable no-console */
'use strict';

module.exports = (engine) => {
  const app = new engine();
  //const router = engine.Router();

  app.use('*', (req, res, next) => {
    res.status(404).send('not found!');
    next();
  });

  return app;
};
