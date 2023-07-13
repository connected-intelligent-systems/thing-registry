'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const { client } = require('../db')
const {
  DescriptionNotFound,
  InvalidDescription,
  InsufficientPermissions,
  ThingAlreadyExists
} = require('../utils/http_errors')
const { validate } = require('../validator')
const findTargets = require('../utils/find_targets')
const findSecurityDefinitions = require('../utils/find_security_definitions')
const findAffordances = require('../utils/find_affordances')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
} = require('./events')

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

      if (validate(description) === false) {
        if (skipValidation === false) {
          throw new InvalidDescription(validate.errors)
        }
      }

      // check if the resource already exists
      const resourceId = await models.resource.find({
        name: description.id,
        exactName: true
      })

      if (resourceId.length > 0) {
        throw new ThingAlreadyExists()
      }

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
          models.resource.createThing(description.id, sub),
          models.resource.createAffordances(targets, sub),
          createStorageThings(description)
        ])
        sendCreateEvent(description)
      } catch (e) {
        // remove all resources created if something failed
        await models.resource.deleteMany(description.id)
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
      const resourceId = await models.resource.find({
        name: id,
        exactName: true
      })

      if (resourceId.length === 0) {
        throw new DescriptionNotFound()
      }

      const removable = await models.access.check({
        resource: resourceId[0],
        scopes: ['delete'],
        token: accessToken.token
      })

      if (removable === undefined) {
        throw new InsufficientPermissions()
      }

      await Promise.all([
        models.thing.deleteById(id, { session }),
        models.target.removeByThingId(id, { session }),
        models.affordances.removeByThingId(id, { session }),
        models.securityDefinitions.removeByThingId(id, { session })
      ])
      await Promise.all([
        models.resource.deleteMany(id),
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
      const resourceId = await models.resource.find({
        name: description.id,
        exactName: true
      })

      if (resourceId.length === 0) {
        throw new DescriptionNotFound()
      }

      const updatable = await models.access.check({
        resource: resourceId[0],
        scopes: ['write'],
        token: accessToken.token
      })

      if (updatable === undefined) {
        throw new InsufficientPermissions()
      }

      if (validate(description) === false) {
        throw new InvalidDescription(validate.errors)
      }

      const { name: sub } = await models.resource.getOwner(description.id)
      const thing = await models.thing.updateById(description, {
        session,
        projection: { source: 1, owner: 1 }
      })
      const targets = findTargets(description, thing.value)
      await Promise.all([
        models.target.updateMany(description.id, targets, { session }),
        models.securityDefinitions.updateMany(
          description.id,
          findSecurityDefinitions(description),
          { session }
        ),
        models.affordances.updateMany(
          description.id,
          findAffordances(description, thing.value),
          { session }
        )
      ])
      await Promise.all([
        models.resource.updateManyProperties(description.id, sub, targets),
        updateStorageThings(description)
      ])
      sendUpdateEvent(description)
    })
  } finally {
    await session.endSession()
  }
}

async function find (accessToken, query) {
  const thingIds = await models.resource.find({
    type: models.resource.ResourceTypes.Thing
  })

  if (thingIds.length === 0) {
    return []
  }

  const permittedThingIds = await models.access.check({
    resource: thingIds,
    resourceType: models.resource.ResourceTypes.Thing,
    scopes: ['read'],
    token: accessToken.token,
    namesOnly: true
  })

  if (permittedThingIds === undefined) {
    return []
  }

  return models.thing.findByIds(permittedThingIds, query)
}

async function findOne (id, accessToken, query) {
  const resourceId = await models.resource.find({
    name: id,
    exactName: true
  })

  if (resourceId.length === 0) {
    throw new DescriptionNotFound()
  }

  const readable = await models.access.check({
    resource: resourceId[0],
    scopes: ['read'],
    token: accessToken.token
  })

  if (readable === undefined) {
    throw new InsufficientPermissions()
  }

  return models.thing.findOne(id, { ...query })
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  update
}
