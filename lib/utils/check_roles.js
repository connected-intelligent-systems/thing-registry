'use strict'

const { InsufficientPermissions } = require('./http_errors')

function checkRoles (roles) {
  return function (req, res, next) {
    const hasRole = roles.some(role => req.roles.includes(role))
    if (hasRole) {
      next()
    } else {
      throw new InsufficientPermissions()
    }
  }
}

exports = module.exports = checkRoles
