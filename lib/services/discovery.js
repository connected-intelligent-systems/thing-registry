'use strict'

const {
  getDiscoveryPlugins,
  updateDiscovery,
  updateDiscoveredThings,
  isDiscoveryRunning,
  getDiscoveredThings,
  getDiscoveredThing,
  getDiscoveredThingsByIds,
  getSettingsForPlugins
} = require('../queries')
const { DescriptionNotFound } = require('../utils/http_errors')
const { generateThingId } = require('../utils/thing_description')
const thingService = require('./thing')
const Ajv = require('ajv')

const DefaultSchema = {}
const ajv = new Ajv({ useDefaults: true })

/**
 * Discover things via plugins for a specific user
 * @param {string} owner - the id of the user
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function discoverThings (owner, accessToken) {
  try {
    const plugins = await getDiscoveryPlugins()
    const pluginSettings = await getSettingsForPlugins(owner, plugins)

    await updateDiscovery(owner, true)

    // interate over all registered & running plugins
    const promises = []
    for (const plugin of plugins) {
      const settings = (pluginSettings || []).find(s => s.name === plugin.name)
      // validate config (can be empty but still valid)
      if (ajv.validate(plugin.schema || DefaultSchema, settings)) {
        promises.push(
          discover(plugin, settings, { accessToken }).then(things => {
            if (Array.isArray(things)) {
              return things.map(thing => ({
                description: thing,
                source: plugin.info.name,
                id: thing.id || generateThingId(),
                owner
              }))
            }
          })
        )
      }
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

    await updateDiscoveredThings({ owner, discoveredThings })
  } finally {
    await updateDiscovery(owner, false)
  }
}

/**
 * Runs the discover function of a plugin of a specific user
 * @param {string} plugin - name of the plugin
 * @param {object} settings - settings for the functions
 * @param {string} settings.session - the mongodb session
 */
async function discover (plugin, settings, options) {
  if (plugin.module.discover === undefined) {
    return Promise.reject(new Error('Discover method not found'))
  }
  return plugin.module.discover(settings, options)
}

/**
 * Runs the discovery for a specific user
 * @param {string} user - the id of the user
 */
async function run (user, accessToken) {
  // only run the discovery if it is not already running for a user
  const isRunning = await isDiscoveryRunning(user)
  // if (isRunning !== true) {
  await discoverThings(user, accessToken)
  // }
}

/**
 * Returns the current status of the discovery for a specific user
 * @param {string} user - id of the user
 */
async function status (user) {
  return {
    running: await isDiscoveryRunning(user)
  }
}

/**
 * Returns all discovered things for a specific user
 * @param {string} user - id of the user
 * @param {boolean} resolve - appends the thing description if true
 */
async function find (user, query) {
  const things = await getDiscoveredThings({ user, ...query })
  return things || {}
}

/**
 * Returns a discovered thing description
 * @param {string} user - id of the user
 * @param {string} id - the id of the thing description
 */
async function findOne (user, id) {
  const thing = await getDiscoveredThing(user, id)
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
  const discoveredThings = await getDiscoveredThingsByIds(sub, things)
  const promises = []
  for (const { description, source } of discoveredThings) {
    promises.push(
      thingService.create(description, accessToken, {
        skipValidation: true,
        enableProxy: true,
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
  importThings
}
