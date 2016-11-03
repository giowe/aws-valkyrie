'use strict';

const valkyrie = require('./valkyrie/index');
const app = new valkyrie();
const router = valkyrie.Router();
const router2 = valkyrie.Router();

exports.handler = (req, context, callback) => {
  app.use(['get', 'post'], '*', (req, res, next) => {
    console.log('PATH >>>', req.path);
    next();
  });

  app.route('/route')
    .get( (req, res) => {
      res.send('this is route in get')
    })
    .post( (req, res) => {
      res.send('this is the same route in post')
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

  router2.get('/hi', (req, res, next) => {
    res.send('hi, this is router2!');
  });

  app.use('/router', router);

  router.use('/router2', router2);


  app.use('*', (req, res) => {
    res.status(404).send('not found!');
  });

  app.describe();
  app.start(req, context, callback);
};
