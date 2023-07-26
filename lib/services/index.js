'use strict'

const thing = require('./thing')
const discovery = require('./discovery')
const access = require('./access')
const credentials = require('./credentials')
const forward = require('./forward')
const permissions = require('./permissions')
const events = require('./events')
const inbox = require('./inbox')

exports = module.exports = {
  thing,
  discovery,
  access,
  credentials,
  forward,
  permissions,
  events,
  inbox
}
