'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const { client } = require('../db')
const {
  InvalidDescription,
  ThingAlreadyExists,
  ThingNotFound
} = require('../utils/http_errors')
const { validate } = require('../validator')
const {
  findSecurityDefinitions,
  findForms
} = require('../utils/thing_description')
const { toExposedThing } = require('../utils/to_exposed_thing')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
} = require('./events')
const { PermissionScopes } = require('../models/permissions')

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

      await Promise.all([
        models.thing.create(description, sub, preferred_username, {
          session,
          ...options
        }),
        models.securityDefinitions.insertMany(
          findSecurityDefinitions(description),
          { session }
        ),
        models.form.insertMany(
          findForms(description, { ...options, owner: sub }),
          { session }
        ),
        models.permissions.create(
          {
            thingId: description.id,
            entityId: sub,
            entityName: 'owner',
            scopes: PermissionScopes,
            owner: sub,
            properties: ['*'],
            actions: ['*'],
            events: ['*'],
            immutable: true
          },
          { session }
        ),
        createStorageThings(description)
      ])

      sendCreateEvent(description)
    })
  } finally {
    await session.endSession()
  }
}

async function remove (id, accessToken) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      const { sub } = accessToken.content
      const deletable = await models.permissions.hasDeletePermissions({
        entityId: sub,
        thingId: id
      })

      if (deletable === null) {
        throw new ThingNotFound()
      }

      await Promise.all([
        models.thing.deleteById(id, { session }),
        models.form.removeByThingId(id, { session }),
        models.securityDefinitions.removeByThingId(id, { session }),
        models.permissions.deleteMany(id, { session }),
        models.credentials.delete(id),
        removeStorageThings(id)
      ])

      sendRemoveEvent(id)
    })
  } catch (e) {
    console.log(e)
    throw e
  } finally {
    await session.endSession()
  }
}

async function update (description, accessToken) {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      const { sub } = accessToken.content
      const updatable = await models.permissions.hasUpdatePermission({
        entityId: sub,
        thingId: description.id
      })

      if (updatable === null) {
        throw new ThingNotFound()
      }

      if (validate(description) === false) {
        throw new InvalidDescription(validate.errors)
      }

      // use correct owner to generate forms, affordances and security definitions
      const { source, owner } = await models.thing.update(description, {
        session
      })

      await Promise.all([
        models.form.updateMany(
          description.id,
          findForms(description, { source, owner }),
          { session }
        ),
        models.securityDefinitions.updateMany(
          description.id,
          findSecurityDefinitions(description),
          { session }
        ),
        updateStorageThings(description)
      ])

      sendUpdateEvent(description)
    })
  } finally {
    await session.endSession()
  }
}

async function find (accessToken, query, protocol, host, path) {
  const { sub } = accessToken.content
  const [readableThings] = await models.permissions.listReadableThings({
    entityId: sub,
    page: query.page,
    pageSize: query.page_size
  })
  const totalPages = readableThings
    ? Math.ceil(readableThings.totalCount.count / query.page_size)
    : 0

  return {
    page: query.page,
    pageSize: query.page_size,
    totalPages,
    hasNextPage: query.page < totalPages,
    things: readableThings
      ? await models.thing.findByIds(
        readableThings.entries.map(thing => thing._id) || [],
        {
          protocol,
          host,
          path
        }
      )
      : []
  }
}

async function findOne (id, accessToken, query) {
  const { sub } = accessToken.content
  const readable = await models.permissions.hasReadPermissions({
    entityId: sub,
    thingId: id
  })

  if (readable === false) {
    throw new ThingNotFound()
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
