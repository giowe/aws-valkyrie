'use strict';

module.exports = (req) => {
  req.params = {};
  req.httpMethod = req.httpMethod.toUpperCase();
  return req;
};
