'use strict'

const thing = require('./thing')
const plugin = require('./plugin')
const pluginSettings = require('./plugin_settings')
const discovery = require('./discovery')
const discoveredThings = require('./discovered_things')
const target = require('./target')
const securityDefinitions = require('./security_definitions')
const credentials = require('./credentials')
const affordances = require('./affordances')
const permissions = require('./permissions')

exports = module.exports = {
  thing,
  plugin,
  pluginSettings,
  discovery,
  discoveredThings,
  target,
  securityDefinitions,
  credentials,
  affordances,
  permissions
}
