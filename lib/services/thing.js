'use strict'

const {
  InvalidDescription,
  ThingAlreadyExists,
  ThingNotFoundError,
  MethodNotAllowed
} = require('../utils/http_errors')
const { validate } = require('../validator')
const {
  createThing,
  getThings,
  getThing,
  checkThingExistence,
  deleteThing,
  updateThing
} = require('../queries')
const { generateThingId } = require('../utils/thing_description')

async function create (description, accessToken, options = {}) {
  const { source, enableProxy } = options
  const { sub } = accessToken.content

  // automatically generate a thing.id if there is none
  if (description.id === undefined) {
    description.id = generateThingId()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
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

async function update (description, accessToken) {
  const { sub } = accessToken.content

  const existingThing = await getThing(sub, description.id)
  if (existingThing === null) {
    throw new ThingNotFoundError()
  }

  if (existingThing.source !== null) {
    throw new MethodNotAllowed()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  return updateThing({
    owner: sub,
    description
  })
}

async function remove (id, accessToken) {
  const { sub } = accessToken.content

  try {
    await deleteThing({
      owner: sub,
      id
    })
  } catch (e) {
    throw new ThingNotFoundError()
  }
}

async function find (accessToken, query) {
  const { sub } = accessToken.content
  const { page, pageSize, resolve } = query
  return getThings({
    owner: sub,
    page,
    pageSize,
    resolve
  })
}

async function findOne (id, accessToken, query) {
  const { sub } = accessToken.content
  const thing = await getThing(sub, id)
  if (thing === null) {
    throw new ThingNotFoundError()
  }
  return thing
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  update
}
