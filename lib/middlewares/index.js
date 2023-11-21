'use strict'

const cors = require('cors')
const services = require('./services')
const jwtDecode = require('./jwt_decode')
const checkTenantId = require('./check_tenant_id')

exports = module.exports = [cors(), checkTenantId, services, jwtDecode]
