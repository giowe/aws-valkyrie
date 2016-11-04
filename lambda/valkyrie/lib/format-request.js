'use strict';

module.exports = (req, app) => {
  req.app = app;
  req.params = {};
  req.httpMethod = req.httpMethod.toLowerCase();
  req.method = req.httpMethod;
  return req;
};
