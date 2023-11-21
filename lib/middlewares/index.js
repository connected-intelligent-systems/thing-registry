'use strict'

const cors = require('cors')
const services = require('./services')
const jwtDecode = require('./jwt_decode')

exports = module.exports = [cors(), services, jwtDecode]
