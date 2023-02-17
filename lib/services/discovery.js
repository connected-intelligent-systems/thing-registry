'use strict'

const models = require('../models')
const { client } = require('../db')
const { DescriptionNotFound } = require('../utils/http_errors')
const thingService = require('./thing')

/**
 * Discover things via plugins for a specific user
 * @param {string} user - the id of the user
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function discoverThings (user, { session }) {
  const plugins = await models.plugin.findDiscovery()
  const pluginSettings = await models.pluginSettings.findByNames(
    plugins.map(plugin => plugin.info.name),
    user,
    { session }
  )
  const promises = []

  await models.discovery.run(user, { session })
  await models.discoveredThings.remove(user, { session })

  // interate over all registered & running plugins
  for (const settings of pluginSettings) {
    const plugin = await models.plugin.findOne(settings.pluginName)
    promises.push(
      discover(plugin, settings).then(things => {
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
    )
  }

  const results = await Promise.allSettled(promises)
  const discoveredThings = results
    .filter(
      result =>
        result.status === 'fulfilled' &&
        result.value !== undefined &&
        Array.isArray(result.value)
    )
    .map(result => result.value)
    .flat()

  await models.discoveredThings.insertMany(user, discoveredThings, {
    session
  })
  await models.discovery.finish(user, { session })
}

/**
 * Runs the discover function of a plugin of a specific user
 * @param {string} plugin - name of the plugin
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function discover (plugin, pluginSettings) {
  if (plugin.module.discover === undefined) {
    return Promise.reject(new Error('Discover method not found'))
  }
  return plugin.module.discover(pluginSettings.settings)
}

/**
 * Runs the discovery for a specific user
 * @param {string} user - the id of the user
 */
async function run (user) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      // only run the discovery if it is not already running for a user
      const isRunning = await models.discovery.isRunning(user, { session })
      if (isRunning !== true) {
        await discoverThings(user, { session })
      }
    })
  } finally {
    await session.endSession()
  }
}

/**
 * Returns the current status of the discovery for a specific user
 * @param {string} user - id of the user
 */
async function status (user) {
  const discovery = await models.discovery.findOne(user)
  if (discovery === null) {
    return {
      running: false
    }
  }
  return {
    running: discovery.running
  }
}

/**
 * Returns all discovered things for a specific user
 * @param {string} user - id of the user
 * @param {boolean} resolve - appends the thing description if true
 */
async function find (user, query) {
  const things = await models.discoveredThings.find(user, query)
  return things || {}
}

/**
 * Returns a discovered thing description
 * @param {string} user - id of the user
 * @param {string} id - the id of the thing description
 */
async function findOne (user, id) {
  const thing = await models.discoveredThings.findOne(user, id)
  if (thing === null) {
    throw new DescriptionNotFound()
  }
  return thing.description
}

/**
 * Import discovered thing descriptions
 * @param {array} things - array of thing descriptions to import
 * @param {object} accessToken - the decoded accesssToken of the current user
 */
async function importThings (things, accessToken) {
  const { sub } = accessToken.content
  const discoveredThings = await models.discoveredThings.findByIds(sub, things)
  const promises = []
  for (const { description, source } of discoveredThings) {
    promises.push(
      thingService.create(description, accessToken, {
        skipValidation: true,
        authorized: true,
        source
      })
    )
  }
  await Promise.allSettled(promises)
}

exports = module.exports = {
  run,
  status,
  find,
  findOne,
  import: importThings
}
