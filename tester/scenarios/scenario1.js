/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();
  //const router = engine.Router();

  app.use('*', (req, res, next) => {
    console.log('calledFrom', engineName);
    res.header('test', 'value');
    res.status(404).send('not found!');
    //next();
  });

  return app;
};
