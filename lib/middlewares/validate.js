'use strict'

const {
  MissingTenantId,
  MissingRoles,
  MissingCustomerId
} = require('../utils/http_errors')

exports = module.exports = (req, res, next) => {
  if (req.tenantId === undefined) {
    throw new MissingTenantId()
  }

  if (
    req.roles === undefined ||
    !['admin', 'customer', 'external'].some(role => req.roles.includes(role))
  ) {
    throw new MissingRoles()
  }

  if (req.roles.includes('customer') && req.customerId === undefined) {
    throw new MissingCustomerId()
  }

  next()
}
