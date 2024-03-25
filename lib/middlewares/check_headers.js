'use strict'

exports = module.exports = (req, res, next) => {
  if (req.headers['x-tenant-id'] !== undefined) {
    req.tenantId = req.headers['x-tenant-id']
  }

  if (req.headers['x-customer-id'] !== undefined) {
    req.customerId = req.headers['x-customer-id']
  }

  if (req.headers['x-auth-request-roles'] !== undefined) {
    req.roles = req.headers['x-auth-request-roles']
      .split(',')
      .map(role => role.trim().replace(/^role:/, ''))
  }

  next()
}
