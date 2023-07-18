'use strict'

const { v4: uuidv4 } = require('uuid')
const {
  InvalidDescription,
  ThingAlreadyExists,
  ThingNotFoundError
} = require('../utils/http_errors')
const { validate } = require('../validator')
const {
  getStoreagePlugins,
  createThing,
  getThings,
  getThing,
  checkThingExistence,
  deleteThing,
  updateThing
} = require('../queries')

async function createStorageThings (description) {
  const plugins = await getStoreagePlugins()
  return Promise.all(plugins.map(plugin => plugin.module.create(description)))
}

async function updateStorageThings (description) {
  const plugins = await getStoreagePlugins()
  return Promise.all(plugins.map(plugin => plugin.module.update(description)))
}

async function removeStorageThings (id) {
  const plugins = await getStoreagePlugins()
  return Promise.all(plugins.map(plugin => plugin.module.delete(id)))
}

async function create (description, accessToken, options = {}) {
  const { skipValidation = false, source, enableProxy = true } = options
  const { sub, preferred_username } = accessToken.content

  // automatically generate a thing.id if there is none
  if (description.id === undefined) {
    description.id = `uri:urn:${uuidv4()}`
  }

  if (validate(description) === false) {
    if (skipValidation === false) {
      throw new InvalidDescription(validate.errors)
    }
  }

  const existingThing = await checkThingExistence(description.id)
  if (existingThing === true) {
    throw new ThingAlreadyExists()
  }

  return createThing({
    owner: sub,
    description,
    enableProxy,
    source
  })
}

async function remove (id, accessToken) {
  const { sub, preferred_username } = accessToken.content

  try {
    return deleteThing({
      owner: sub,
      id
    })
  } catch (e) {
    throw new ThingNotFoundError()
  }
}

async function update (description, accessToken) {
  const { sub, preferred_username } = accessToken.content

  const existingThing = await checkThingExistence(description.id)
  if (existingThing === true) {
    throw new ThingAlreadyExists()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  return updateThing({
    owner: sub,
    description,
    enableProxy,
    source
  })
}

async function find (accessToken, query) {
  const { sub } = accessToken.content
  // todo: add query parameters
  return getThings(sub)
}

async function findOne (id, accessToken, query) {
  const { sub } = accessToken.content
  return getThing(sub)
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  update
}
