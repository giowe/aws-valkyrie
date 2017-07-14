/* eslint-disable no-console */
'use strict';

const valkyrie = require('./valkyrie/valkyrie');
const app = new valkyrie();
const router = valkyrie.Router();
const router2 = valkyrie.Router();

const middle1 = (req, res, next) => {
  console.log('middle1');
  next();
  //res.send('this is middle 1');
};

const skipMiddle = (req, res, next) => {
  console.log('this middleware skip to next route');
  next('route');
};

app.get('/test-next', (req, res) => {
  res.send('test-next-skipped');
});

app.use((req, res, next) => {
  console.log('PATH >>>', req.path);
  next();
});

app.use('/router', router);

app.use('/test-next-2', middle1, middle1, middle1, skipMiddle, middle1, middle1, (req, res) => {
  res.send('test-next');
});
//todo gestire eventualmente url multipli
/*app.use(['/route', ['/route2', '/route3']], (req, res, next) => {
  console.log('sto qui');
  next();
});
*/
/*app.route('/route')
  .get((req, res) => {
    res.send('this is route in get');
  })
  .post((req, res) => {
    res.send('this is the same route in post');
  })
  .head((req, res) => {
    res.sendStatus(201);
  });

app.route('/route')
  .put((req, res) => {
    res.sendStatus(201);
  });
*/
app.get('/send-status/:statusCode', (req, res) => {
  res.sendStatus(req.params.statusCode);
});

app.post('/post-test', (req, res) => {
  res.send('this is a test in post');
});

app.get('/log-request', (req, res) => {
  res.send(req);
});

// router.use((req, res, next) => {
//   res.append('custom-header-field', 'Valkyrie!');
//   console.log('possible auth middleware');
//   next();
// });

router.get('/say/:text', (req, res) => {
  console.log(`param text is equal to ${req.params.text}`);
  res.send(`I just want to say "${req.params.text}"`);
});

router2.get('/hi', (req, res) => {
  res.send('hi, this is router2!');
});

//router.use('/router2', router2);

app.use('*', (req, res, next) => {
  res.status(404).send('not found!');
  next();
});

app.describe();

exports.handler = (...args) => app.handleRequest(...args);
