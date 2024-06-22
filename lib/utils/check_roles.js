'use strict'

const { InsufficientPermissions } = require('./http_errors')

/**
 * Middleware function to check if the user has the required roles.
 *
 * @param {Array<string>} roles - The roles required to access the route.
 * @returns {Function} - The middleware function.
 */
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
