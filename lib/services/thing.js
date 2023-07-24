'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const { client } = require('../db')
const {
  InvalidDescription,
  ThingAlreadyExists
} = require('../utils/http_errors')
const { validate } = require('../validator')
const findTargets = require('../utils/find_targets')
const findSecurityDefinitions = require('../utils/find_security_definitions')
const findAffordances = require('../utils/find_affordances')
const { toExposedThing } = require('../utils/to_exposed_thing')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
} = require('./events')
const uma = require('./uma')

async function createStorageThings (description) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.create(description)))
}

async function updateStorageThings (description) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.update(description)))
}

async function removeStorageThings (id) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.delete(id)))
}

async function create (description, accessToken, options = {}) {
  const { skipValidation = false } = options
  const session = client.startSession()
  try {
    const { sub, preferred_username } = accessToken.content
    await session.withTransaction(async () => {
      // automatically generate a thing.id if there is none
      if (description.id === undefined) {
        description.id = `uri:urn:${uuidv4()}`
      }

      // check if the resource already exists
      const exists = await models.thing.existsById(description.id)
      if (exists === true) {
        throw new ThingAlreadyExists()
      }

      if (validate(description) === false) {
        if (skipValidation === false) {
          throw new InvalidDescription(validate.errors)
        }
      }

      // expose thing by adding securityDefinition and forms for supported types
      description = toExposedThing(description)

      const targets = findTargets(description, { ...options, owner: sub })

      try {
        await Promise.all([
          models.thing.create(description, sub, preferred_username, {
            session,
            ...options
          }),
          models.securityDefinitions.insertMany(
            findSecurityDefinitions(description),
            { session }
          ),
          models.target.insertMany(targets, { session }),
          models.affordances.insertMany(
            findAffordances(description, {
              ...options,
              user: sub,
              username: preferred_username
            }),
            { session }
          )
        ])
        await Promise.all([
          uma.createResources({ id: description.id, targets, user: sub }),
          createStorageThings(description)
        ])
        sendCreateEvent(description)
      } catch (e) {
        // remove all resources created if something failed
        await uma.deleteResources(description.id)
        // rethrow exception
        throw e
      }
    })
  } finally {
    await session.endSession()
  }
}

async function remove (id, accessToken) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      await uma.hasDeletePermissions({
        accessToken,
        id
      })

      await Promise.all([
        models.thing.deleteById(id, { session }),
        models.target.removeByThingId(id, { session }),
        models.affordances.removeByThingId(id, { session }),
        models.securityDefinitions.removeByThingId(id, { session })
      ])

      await Promise.all([
        uma.deleteResources(id),
        models.credentials.delete(id),
        removeStorageThings(id)
      ])

      sendRemoveEvent(id)
    })
  } finally {
    await session.endSession()
  }
}

async function update (description, accessToken) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      await uma.hasWritePermissions({
        accessToken,
        id
      })

      if (validate(description) === false) {
        throw new InvalidDescription(validate.errors)
      }

      const { source, owner, username } = await models.thing.update(description)
      const targets = findTargets(description, { source, owner })

      await Promise.all([
        models.target.updateMany(description.id, targets, { session }),
        models.securityDefinitions.updateMany(
          description.id,
          findSecurityDefinitions(description),
          { session }
        ),
        models.affordances.updateMany(
          description.id,
          findAffordances(description, { source, owner, username } ),
          { session }
        )
      ])

      await Promise.all([
        uma.updateResources({ id: description.id, targets }),
        updateStorageThings(description)
      ])

      sendUpdateEvent(description)
    })
  } finally {
    await session.endSession()
  }
}

async function find (accessToken, query) {
  const permittedThingIds = await uma.listThings({ accessToken })
  return models.thing.findByIds(permittedThingIds, query)
}

async function findOne (id, accessToken, query) {
  await uma.hasReadPermissions({ id, accessToken })
  return models.thing.findOne(id, { ...query })
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  update
}
