'use strict'

const models = require('../models')
const Ajv = require('ajv')
const {
  PluginNotFound,
  InvalidPluginSettings,
  DiscoveryScanFailed,
  MethodNotAllowed,
  PluginSettingsNotFound,
  PluginSettingsMissing
} = require('../utils/http_errors')
const { client } = require('../db')

const ajv = new Ajv({ useDefaults: true })
const DefaultSchema = {
  type: 'object',
  additionalProperties: false
}

async function getSettings (plugin, user) {
  // only return settings if a schema was provide by the plugin
  if (plugin.schema !== undefined && plugin.schema !== null) {
    const { settings } = await models.pluginSettings.findOne(plugin.name, user)
    // validate schema to create default values
    ajv.validate(plugin.schema || DefaultSchema, settings)
    return settings
  }
}

/**
 * Discover things via plugins for a specific user
 * @param {string} user - the id of the user
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function startScan (id, user, accessToken) {
  const plugin = await models.plugin.findOne(id)
  const settings = await getSettings(plugin, user)

  // todo: clean this more up
  if (settings === undefined && plugin.schema !== undefined) {
    throw new PluginSettingsMissing()
  }

  try {
    const discoveredThings = await plugin.module
      .discover(settings, {
        accessToken
      })
      .then(things => {
        if (Array.isArray(things)) {
          return things.map(thing => ({
            description: thing,
            source: plugin.info.name,
            id: thing.id,
            foundAt: new Date(),
            user
          }))
        }
      })

    if (discoveredThings.length > 0) {
      const session = client.startSession()
      try {
        await models.inbox.removeMany(id, user, { session })
        await models.inbox.insertMany(user, discoveredThings, {
          session
        })
      } finally {
        await session.endSession()
      }
    }

    return {
      status: 'success',
      thingsFound: discoveredThings.length
    }
  } catch (error) {
    throw new DiscoveryScanFailed(id, error.message)
  }
}

async function getDiscoveryPlugins () {
  const plugins = await models.plugin.findDiscovery()
  return plugins.map(plugin => ({
    ...plugin.info
  }))
}

async function getDiscoveryPlugin (id, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const settings = await getSettings(plugin, user)
  return {
    ...plugin.info,
    schema: plugin.schema,
    settings
  }
}

async function updateDiscoveryPluginSettings (id, settings, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  if (plugin.schema === undefined || plugin.schema === null) {
    throw new MethodNotAllowed()
  }

  const valid = ajv.validate(plugin.schema || DefaultSchema, settings)
  if (valid) {
    await models.pluginSettings.update(id, user, settings)
    if (plugin.updateSettings !== undefined) {
      await plugin.updateSettings(plugin.context)
    }
  } else {
    throw new InvalidPluginSettings()
  }
}

async function getDiscoveryPluginSettings (id, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const settings = await getSettings(plugin, user)
  if (settings === undefined || settings === null) {
    throw new PluginSettingsNotFound()
  }
  return settings
}

exports = module.exports = {
  startScan,
  getDiscoveryPlugins,
  getDiscoveryPlugin,
  updateDiscoveryPluginSettings,
  getDiscoveryPluginSettings
}
