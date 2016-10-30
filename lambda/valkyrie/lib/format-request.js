'use strict';

module.exports = (req, app) => {
  req.app = app;
  req.params = {};
  req.httpMethod = req.httpMethod.toUpperCase();
  return req;
};
