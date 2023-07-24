'use strict'

const thing = require('./thing')
const plugins = require('./plugin')
const discovery = require('./discovery')
const plugin = require('./plugin')
const access = require('./access')
const credentials = require('./credentials')
const forward = require('./forward')
const affordances = require('./affordances')
const permissions = require('./permissions')
const events = require('./events')

exports = module.exports = {
  thing,
  plugins,
  discovery,
  plugin,
  access,
  credentials,
  forward,
  affordances,
  permissions,
  events
}
