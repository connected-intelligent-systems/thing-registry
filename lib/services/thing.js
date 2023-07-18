'use strict'

const { v4: uuidv4 } = require('uuid')
const models = require('../models')
const {
  InvalidDescription,

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

const findAffordances = require('../utils/find_affordances')
const findSecurityDefinitions = require('../utils/find_security_definitions')
const findTargets = require('../utils/find_targets')
const { PrismaClient, ThingAuthorizationScope } = require('@prisma/client')
const { hasThingReadAccess } = require('./permissions')
const prisma = new PrismaClient()

function getThingTypes (description) {
  if (description['@type'] !== undefined) {
    if (Array.isArray(description['@type'])) {
      return description['@type']
    }
    return [description['@type']]
  }
}

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

  const existingThing = await prisma.thing.findUnique({
    where: { id: description.id }
  })
  if (existingThing !== null) {
    throw new ThingAlreadyExists()
  }

  const newThing = {
    data: {
      description,
      id: description.id,
      owner: sub,
      title: description.title,
      types: getThingTypes(description),
      Affordances: {
        createMany: {
          data: findAffordances(description, { owner: sub })
        }
      }
    }
  }

  if (enableProxy) {
    newThing.data.description = toExposedThing(description)
    newThing.data.Targets = {
      createMany: {
        data: findTargets(description, { owner: sub })
      }
    }
  }

  const createdThing = await prisma.thing.create(newThing)

  sendCreateEvent(createdThing.id)

  return createdThing
}

async function remove (id, accessToken) {
  const { sub, preferred_username } = accessToken.content

  try {
    await prisma.thing.delete({
      where: {
        id,
        owner: sub
      }
    })

    sendRemoveEvent(id)
  } catch (e) {
    throw new ThingNotFoundError()
  }
}

async function update (description, accessToken) {
  const { sub, preferred_username } = accessToken.content

  const existingThing = await prisma.thing.findUnique({
    where: { id: description.id, owner: sub }
  })
  if (existingThing === null) {
    throw new ThingNotFoundError()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  const affordances = findAffordances(description, { owner: sub })
  const securityDefinitions = findSecurityDefinitions(description)
  const targets = findTargets(description, { owner: sub })

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
      Targets: {
        deleteMany: {
          thingId: description.id
        },
        createMany: {
          data: targets
        }
      }
      // todo: how to handle access of deleted properties etc.
    }
  })

  sendUpdateEvent(description)
}

async function find (accessToken, query) {
  const { sub } = accessToken.content

  // todo: add query parameters
  return prisma.thing.findMany({
    where: {
      OR: [
        { owner: sub },
        {
          ThingAuthorizations: {
            every: {
              entityId: sub,
              scope: ThingAuthorizationScope.read
            }
          }
        }
      ]
    },
    select: {
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

async function findOne (id, accessToken, query) {
  const { sub } = accessToken.content

  const readable = await hasThingReadAccess(id, sub)

  // todo: implement query
  const thing = await prisma.thing.findUnique({
    where: {
      id,
      ThingAuthorizations: {
        every: {
          entityId: sub,
          scope: ThingAuthorizationScope.read
        }
      }

      // OR: [
      //   { owner: sub },
      //   {
      //     ThingAuthorizations: {
      //       every: {
      //         entityId: sub,
      //         scope: ThingAuthorizationScope.read
      //       }
      //     }
      //   }
      // ]
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
