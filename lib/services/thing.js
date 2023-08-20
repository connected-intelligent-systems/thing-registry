'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const { prisma } = require('../db')
const {
  InvalidDescription,
  ThingAlreadyExists,
  ThingNotFound
} = require('../utils/http_errors')
const { validate } = require('../validator')
const {
  getTypes
} = require('../utils/thing_description')
const { toExposedThing } = require('../utils/to_exposed_thing')
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

async function create (description, tenantId, options = {}) {
  const { skipValidation = false } = options

  // automatically generate a thing.id if there is none
  if (description.id === undefined) {
    description.id = `urn:uuid:${uuidv4()}`
  }

  const exists = await prisma.thing.findFirst({
    where: {
      id: description.id,
      tenantId
    }, select: {
      id: true
    }
  })

  if (exists !== null) {
    throw new ThingAlreadyExists()
  }

  if (validate(description) === false) {
    if (skipValidation === false) {
      throw new InvalidDescription(validate.errors)
    }
  }

  // expose thing by adding securityDefinition and forms for supported types
  description = toExposedThing(description)

  const createdThing = await prisma.thing.create({ 
    data: {
      id: description.id,
      tenantId,
      description,
      types: getTypes(description),
      title: description.title,
    }
  })

  await createStorageThings(description)

  sendCreateEvent(description)

  return createdThing
}

async function remove (id, tenantId) {
  await prisma.thing.delete({ 
    where: {
      id,
      tenantId
    }
  })

  await Promise.all([
    models.credentials.delete(id),
    removeStorageThings(id)
  ])

  sendRemoveEvent(id)
}

async function update (description, tenantId) {
  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  await prisma.thing.update({ 
    where: {
      id: description.id,
      tenantId
    }, 
    data: {
      description
    }
  })

  await updateStorageThings(description)

  sendUpdateEvent(description)
}

async function find (tenantId, query) {
  const [ totalCount, things ] = await prisma.$transaction([
    prisma.thing.count({ where: { tenantId }}),
    prisma.thing.findMany({
      where: {
        tenantId
      },
      select: {
        id: true,
        title: true,
        types: true,
        description: query.resolve === true,
        createdAt: true,
        updatedAt: true,
        tenantId: false
      },
      skip: (query.page - 1) * query.page_size,
      take: query.page_size
    })
  ])

  return {
    page: query.page,
    pageSize: query.page_size,
    totalPages: Math.ceil(totalCount / query.page_size),
    things
  }
}

async function findOne (id, tenantId) {
  const thing = await prisma.thing.findFirst({ 
    where: {
      id,
      tenantId
    },
    select: {
      description: true,
    }
  })

  if(thing === null) {
    throw new ThingNotFound()
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
