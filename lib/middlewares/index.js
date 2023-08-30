'use strict'

const cors = require('cors')
const services = require('./services')

exports = module.exports = [cors(), services]
