'use strict'

exports = module.exports = function (req, res, next) {
  if (req.kauth && req.kauth.grant) {
    req.auth = {
      access_token: {
        token: req.kauth.grant.access_token.token,
        content: req.kauth.grant.access_token.content
      }
    }
  }
  next()
}
