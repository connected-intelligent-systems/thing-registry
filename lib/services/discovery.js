'use strict'

const models = require('../models')
const Ajv = require('ajv')
const {
  PluginNotFound,
  InvalidPluginSettings,
  DiscoveryScanFailed
} = require('../utils/http_errors')
const { client } = require('../db')

const ajv = new Ajv({ useDefaults: true })
const DefaultSchema = {
  type: 'object',
  additionalProperties: false
}

/**
 * Discover things via plugins for a specific user
 * @param {string} user - the id of the user
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function scan (id, user, accessToken) {
  const plugin = await models.plugin.findOne(id)
  const settings = await models.pluginSettings.findOne(id, user)

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

async function find () {
  const plugins = await models.plugin.findDiscovery()
  return plugins.map(plugin => ({
    ...plugin.info
  }))
}

async function findOne (id, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }
  const { settings } = await getSettings(id, user)
  return {
    ...plugin.info,
    schema: plugin.schema,
    settings
  }
}

async function updateSettings (id, settings, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
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

async function getSettings (id, user) {
  const plugin = await models.plugin.findOneDiscovery(id)
  if (plugin === undefined) {
    throw new PluginNotFound()
  }

  const { settings } = await models.pluginSettings.findOne(id, user)
  ajv.validate(plugin.schema || DefaultSchema, settings)
  return settings
}

// todo: remove
async function findWithCustomType (type) {
  const plugins = await models.plugin.findStorage()
  return plugins.find(plugin => plugin.customTypes.include(type))
}

// todo: remove
async function findWithCustomTypes () {
  const plugins = await models.plugin.findStorage()
  return plugins.filter(plugin => plugin.customTypes !== undefined)
}

exports = module.exports = {
  scan,
  find,
  findOne,
  updateSettings,
  getSettings,
  findWithCustomType,
  findWithCustomTypes
}
