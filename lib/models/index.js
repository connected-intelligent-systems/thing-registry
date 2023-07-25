'use strict'

const thing = require('./thing')
const plugin = require('./plugin')
const pluginSettings = require('./plugin_settings')
const inbox = require('./inbox')
const target = require('./target')
const securityDefinitions = require('./security_definitions')
const credentials = require('./credentials')
const affordances = require('./affordances')
const permissions = require('./permissions')

exports = module.exports = {
  thing,
  plugin,
  pluginSettings,
  inbox,
  target,
  securityDefinitions,
  credentials,
  affordances,
  permissions
}
