'use strict'

const cors = require('cors')
const services = require('./services')
const jwtDecode = require('./jwt_decode')
const checkHeaders = require('./check_headers')
const validate = require('./validate')

exports = module.exports = [
  cors(),
  jwtDecode,
  checkHeaders,
  services,
  validate
]
