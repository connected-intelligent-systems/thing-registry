'use strict'

const cors = require('cors')
const services = require('./services')
const auth = require('./auth')
const queryToken = require('./query_token')

exports = module.exports = [cors(), queryToken, auth, services]
