'use strict'

const Ajv = require('ajv')
const models = require('../models')
const {
  PluginNotFound,
  InvalidPluginSettings,
  DiscoveryScanFailed,
  MethodNotAllowed,
  PluginSettingsNotFound,
  PluginSettingsMissing
} = require('../utils/http_errors')
const { client } = require('../db')
const CredentialsStorage = require('../utils/credentials_storage')
const { getTypes } = require('../utils/thing_description')

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

function requiresPluginSettings (plugin) {
  return plugin.schema !== undefined && plugin.schema !== null
}

/**
 * Adds additional information to a discovered thing
 */
function mapDiscoveredThing (thing, user, plugin) {
  return {
    id: thing.id,
    user,
    description: thing,
    types: getTypes(thing),
    title: thing.title,
    source: plugin.info.name,
    foundAt: new Date()
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

  if (requiresPluginSettings(plugin) && settings === undefined) {
    throw new PluginSettingsMissing()
  }

  try {
    const discoveredThings = await plugin.module
      .discover(settings, {
        credentialsStorage: new CredentialsStorage(id, user),
        accessToken
      })
      .then(things => {
        if (Array.isArray(things)) {
          return things.map(thing => mapDiscoveredThing(thing, user, plugin))
        }
      })

    const session = client.startSession()
    try {
      await models.inbox.updateMany(id, user, discoveredThings, { session })
    } finally {
      await session.endSession()
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
