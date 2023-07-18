'use strict'

const Ajv = require('ajv')
const {
  PluginNotFound,
  InvalidPluginSettings
} = require('../utils/http_errors')
const {
  updatePluginSettings,
  getPlugins,
  getPlugin,
  getPluginSettings,
  getStoreagePlugins
} = require('../queries')

const ajv = new Ajv({ useDefaults: true })
const DefaultSchema = {
  type: 'object',
  additionalProperties: false
}

async function find () {
  const plugins = await getPlugins()
  return plugins.map(plugin => ({
    ...plugin.info
  }))
}

async function findOne (id, user) {
  const plugin = await getPlugin(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }
  const { settings } = await getPluginSettings(user, id)
  return {
    ...plugin.info,
    schema: plugin.schema,
    settings
  }
}

async function updateSettings (id, settings, user) {
  const plugin = await getPlugin(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const valid = ajv.validate(plugin.schema || DefaultSchema, settings)
  if (valid) {
    await updatePluginSettings(user, id, settings)
    if (plugin.updateSettings !== undefined) {
      await plugin.updateSettings(plugin.context)
    }
  } else {
    throw new InvalidPluginSettings()
  }
}

async function findWithCustomType (type) {
  const plugins = await getStoreagePlugins()
  return plugins.find(plugin => plugin.customTypes.include(type))
}

async function findWithCustomTypes () {
  const plugins = await getStoreagePlugins()
  return plugins.filter(plugin => plugin.customTypes !== undefined)
}

exports = module.exports = {
  find,
  findOne,
  updateSettings,
  findWithCustomType,
  findWithCustomTypes
}
