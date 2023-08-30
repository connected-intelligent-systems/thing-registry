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
const { client, prisma } = require('../db')
const CredentialsStorage = require('../utils/credentials_storage')
const { getTypes } = require('../utils/thing_description')

const ajv = new Ajv({ useDefaults: true })
const DefaultSchema = {
  type: 'object',
  additionalProperties: false
}

async function getSettings (plugin, tenantId) {
  // only return settings if a schema was provide by the plugin
  if (plugin.schema !== undefined && plugin.schema !== null) {
    const pluginSettings = await prisma.pluginSettings.findFirst({
      where: {
        name: plugin.info.name,
        tenantId
      }
    })

    if (pluginSettings === null) {
      return
    }

    // validate schema to create default values
    ajv.validate(plugin.schema || DefaultSchema, pluginSettings.settings)
    return pluginSettings.settings
  }
}

function requiresPluginSettings (plugin) {
  return plugin.schema !== undefined && plugin.schema !== null
}

/**
 * Adds additional information to a discovered thing
 */
function mapDiscoveredThing (thing, tenantId, plugin) {
  return {
    id: thing.id,
    tenantId,
    description: thing,
    types: getTypes(thing),
    title: thing.title,
    source: plugin.info.name
  }
}

/**
 * Discover things via plugins for a specific user
 * @param {string} tenantId - the id of the user
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function startScan (id, tenantId) {
  const plugin = await models.plugin.findOne(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const settings = await getSettings(plugin, tenantId)

  if (requiresPluginSettings(plugin) && settings === undefined) {
    throw new PluginSettingsMissing()
  }

  try {
    const discoveredThings = await plugin.module
      .discover(settings, {
        credentialsStorage: new CredentialsStorage(id, tenantId)
      })
      .then(things => {
        if (Array.isArray(things)) {
          return things.map(thing =>
            mapDiscoveredThing(thing, tenantId, plugin)
          )
        }
      })

    await prisma.discoveredThing.createMany({ data: discoveredThings })

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

async function getDiscoveryPlugin (id, tenantId) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const settings = await getSettings(plugin, tenantId)
  return {
    ...plugin.info,
    schema: plugin.schema,
    settings
  }
}

async function updateDiscoveryPluginSettings (id, settings, tenantId) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  if (plugin.schema === undefined || plugin.schema === null) {
    throw new MethodNotAllowed()
  }

  const valid = ajv.validate(plugin.schema || DefaultSchema, settings)
  if (valid) {
    await prisma.pluginSettings.upsert({
      where: {
        name_tenantId: {
          tenantId,
          name: id
        }
      },
      create: {
        name: id,
        tenantId,
        settings
      },
      update: {
        name: id,
        tenantId,
        settings
      }
    })
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
