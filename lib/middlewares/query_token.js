'use strict'

exports = module.exports = (req, res, next) => {
  if (req.query.access_token) {
    // simply convert the query parameter to a header bearer token
    // so the auth middleware will work as normal
    if (req.headers['authorization'] === undefined) {
      req.headers['authorization'] = `Bearer ${req.query.access_token}`
    }
  }
  next()
}
