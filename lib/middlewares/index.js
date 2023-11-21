'use strict'

const cors = require('cors')
const services = require('./services')
const jwtDecode = require('./jwt_decode')
const checkTenantId = require('./check_tenant_id')

const middlewares = [cors(), checkTenantId, services, jwtDecode]

if (process.env.NODE_ENV === 'development') {
  middlewares.unshift((req, res, next) => {
    req.headers['x-tenant-id'] = 'default'
    next()
  })
}

exports = module.exports = middlewares
