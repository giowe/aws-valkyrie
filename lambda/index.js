'use strict';

const valkyrie = require('./valkyrie/index');
const app = new valkyrie();
const router = valkyrie.Router();

exports.handler = (req, context, callback) => {
  app.use(['get', 'post'], '*', (req, res, next) => {
    console.log('PATH >>>', req.path);
    next();
  });

  app.get('/send-status/:statusCode', (req, res, next) => {
    res.sendStatus(req.params.statusCode);
  });

  app.get('/log-request', (req, res, next) => {
    res.send(req);
  });

  router.use((req, res, next) => {
    res.append('custom-header-field', 'Valkyrie!');
    console.log('possible auth middleware');
    next();
  });


  router.get('/say/:text', (req, res, next) => {
    console.log(`param text is equal to ${req.params.text}`);
    res.send(`I just want to say "${req.params.text}"`);
  });

  app.use('/router', router);

  /*app.use('*', (req, res) => {
    res.status(404).send('not found!');
  });*/

  app.start(req, context, callback);
};
