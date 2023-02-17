'use strict'

const thing = require('./thing')
const plugin = require('./plugin')
const pluginSettings = require('./plugin_settings')
const discovery = require('./discovery')
const discoveredThings = require('./discovered_things')
const resource = require('./resource')
const access = require('./access')
const target = require('./target')
const securityDefinitions = require('./security_definitions')
const credentials = require('./credentials')
const affordances = require('./affordances')
const tickets = require('./tickets')

exports = module.exports = {
  thing,
  plugin,
  pluginSettings,
  discovery,
  discoveredThings,
  resource,
  access,
  target,
  securityDefinitions,
  credentials,
  affordances,
  tickets
}
