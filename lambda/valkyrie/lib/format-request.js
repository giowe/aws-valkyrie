'use strict';

module.exports = (req, app) => {
  req.app = app;
  req.params = {};
  req.method = req.httpMethod.toUpperCase();
  return req;
};
