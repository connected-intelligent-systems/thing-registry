'use strict'

const env = require('env-var')
const { MissingTenantIdHeader } = require('../utils/http_errors')

const DefaultTenantId = env
  .get('DEFAULT_TENANT_ID')
  .default('default')
  .asString()

exports = module.exports = (req, res, next) => {
  if (req.headers['x-tenant-id'] === undefined) {
    if (DefaultTenantId !== undefined) {
      req.headers['x-tenant-id'] = DefaultTenantId
    } else {
      throw new MissingTenantIdHeader()
    }
  }
  next()
}
