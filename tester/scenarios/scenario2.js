/* eslint-disable no-console */
'use strict';

module.exports = (engine, engineName) => {
  const app = new engine();
  //const router = engine.Router();

  app.all('*', (req, res, next) => {
    console.log('calledFrom', engineName);
    res.header('test', 'value');
    res.status(200).json({ test: 'test', name: 'John' });
    //next();
  });

  return app;
};
