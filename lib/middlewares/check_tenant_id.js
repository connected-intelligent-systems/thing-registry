'use strict'

const { MissingTenantIdHeader } = require('../utils/http_errors')

exports = module.exports = (req, res, next) => {
  if (req.headers['x-tenant-id'] === undefined) {
    throw new MissingTenantIdHeader()
  }
  next()
}
