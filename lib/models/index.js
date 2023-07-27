'use strict'

const thing = require('./thing')
const plugin = require('./plugin')
const pluginSettings = require('./plugin_settings')
const inbox = require('./inbox')
const form = require('./form')
const securityDefinitions = require('./security_definitions')
const credentials = require('./credentials')
const permissions = require('./permissions')

exports = module.exports = {
  thing,
  plugin,
  pluginSettings,
  inbox,
  form,
  securityDefinitions,
  credentials,
  permissions
}
