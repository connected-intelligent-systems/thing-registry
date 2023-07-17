'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const {
  DescriptionNotFound,
  InvalidDescription,
  InsufficientPermissions,
  ThingAlreadyExists,
  ThingNotFoundError
} = require('../utils/http_errors')
const { validate } = require('../validator')
const { toExposedThing } = require('../utils/to_exposed_thing')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
} = require('./events')

const { PrismaClient } = require('@prisma/client')
const findAffordances = require('../utils/find_affordances')
const findSecurityDefinitions = require('../utils/find_security_definitions')
const prisma = new PrismaClient()

function getThingTypes(description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

async function createStorageThings(description) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.create(description)))
}

async function updateStorageThings(description) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.update(description)))
}

async function removeStorageThings(id) {
  const plugins = await models.plugin.findStorage()
  return Promise.all(plugins.map(plugin => plugin.module.delete(id)))
}

async function create(description, accessToken, options = {}) {
  const { skipValidation = false } = options
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

  const existingThing = await prisma.thing.findUnique({ where: { id: description.id } })
  if (existingThing !== null) {
    throw new ThingAlreadyExists()
  }

  const affordances = findAffordances(description, { owner: sub })
  const securityDefinitions = findSecurityDefinitions(description)

  const createdThing = await prisma.thing.create({
    data: {
      description: toExposedThing(description),
      id: description.id,
      owner: sub,
      title: description.title,
      types: getThingTypes(description),
      SecurityDefinitions: {
        createMany: {
          data: securityDefinitions
        }
      },
      Affordances: {
        createMany: {
          data: affordances
        }
      },
    }
  })


  sendCreateEvent(createdThing.id)

  return createdThing
}

async function remove(id, accessToken) {
  await prisma.thing.delete({
    where: {
      id
    }
  })

  sendRemoveEvent(id)
}

async function update(description, accessToken) {
  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  const { sub, preferred_username } = accessToken.content
  

  const existingThing = await prisma.thing.findUnique({ where: { id: description.id } })
  if (existingThing === null) {
    throw new ThingNotFoundError()
  }

  const affordances = findAffordances(description, { owner: sub })
  const securityDefinitions = findSecurityDefinitions(description)

  await prisma.thing.update({
    where: {
      id: description.id
    },
    data: {
      description: toExposedThing(description),
      title: description.title,
      types: getThingTypes(description),
      SecurityDefinitions: {
        deleteMany: { 
          thingId: description.id
        },
        createMany: {
          data: securityDefinitions
        }
      },
      Affordances: {
        deleteMany: { 
          thingId: description.id
        },
        createMany: {
          data: affordances
        }
      },
    },
  })

  sendUpdateEvent(description)
}

async function find(accessToken, query) {
  const { sub } = accessToken.content

  // todo: add query parameters
  return prisma.thing.findMany({
    where: {
      owner: sub
    }, select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      title: true,
      types: true,
      owner: true,
      description: false
    }
  })
}

async function findOne(id, accessToken, query) {
  const { sub } = accessToken.content

  // todo: implement query
  const thing = await prisma.thing.findUnique({
    where: {
      id
    }
  })

  return thing
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  update
}
