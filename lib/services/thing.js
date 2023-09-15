'use strict'

const { v4: uuidv4 } = require('uuid')
const tdToOpenAPI = require('@thing-description-playground/td_to_openapi')
const { prisma } = require('../db')
const {
  InvalidDescription,
  ThingAlreadyExists,
  ThingNotFound
} = require('../utils/http_errors')
const { validate } = require('../validator')
const {
  getTypes,
  getPublicForms,
  getSecurityDefinitions
} = require('../utils/thing_description')
const { toPublicThing } = require('../utils/to_public_thing')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent
} = require('./events')
const { addDefaults } = require('@thing-description-playground/defaults')

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
    },
    select: {
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

  addDefaults(description)

  const createdThing = await prisma.thing.create({
    data: {
      id: description.id,
      tenantId,
      source: options.source,
      title: description.title,
      types: getTypes(description),
      description,
      publicDescription: toPublicThing(description),
      securityDefintions: {
        createMany: {
          data: getSecurityDefinitions(description)
        }
      },
      publicForms: {
        createMany: {
          data: getPublicForms(description, options.source)
        }
      }
    }
  })

  sendCreateEvent(createdThing, tenantId)

  return createdThing
}

async function remove (id, tenantId) {
  const exists = await prisma.thing.findFirst({
    where: {
      id,
      tenantId
    },
    select: {
      id: true
    }
  })

  if (exists === null) {
    throw new ThingNotFound()
  }

  await prisma.thing.delete({
    where: {
      id,
      tenantId
    }
  })

  sendRemoveEvent(id, tenantId)
}

async function update (description, tenantId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id: description.id,
      tenantId
    },
    select: {
      id: true,
      source: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  addDefaults(description)

  const securityDefinitions = getSecurityDefinitions(description)
  const updatedThing = await prisma.thing.update({
    where: {
      id: description.id,
      tenantId
    },
    data: {
      title: description.title,
      types: getTypes(description),
      description,
      publicDescription: toPublicThing(description, tenantId),
      securityDefintions: {
        deleteMany: {
          OR: [
            {
              tenantId,
              thingId: description.id,
              name: {
                notIn: securityDefinitions.map(
                  securityDefinition => securityDefinition.name
                )
              }
            },
            {
              OR: securityDefinitions.map(securityDefinition => ({
                tenantId,
                thingId: description.id,
                name: securityDefinition.name,
                scheme: {
                  not: securityDefinition.scheme
                }
              }))
            }
          ]
        },
        createMany: {
          data: securityDefinitions,
          skipDuplicates: true
        },
        update: securityDefinitions.map(securityDefinition => ({
          data: securityDefinition,
          where: {
            thingId_tenantId_name: {
              name: securityDefinition.name,
              tenantId,
              thingId: description.id
            }
          }
        }))
      },
      publicForms: {
        deleteMany: {
          tenantId,
          thingId: description.id
        },
        createMany: {
          data: getPublicForms(description, thing.source)
        }
      }
    }
  })

  sendUpdateEvent(updatedThing, tenantId)
}

async function find (tenantId, query) {
  const [totalCount, things] = await prisma.$transaction([
    prisma.thing.count({ where: { tenantId } }),
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
      description: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  return thing
}

async function findOneOpenApi (id, tenantId) {
  const thing = await findOne(id, tenantId)
  const openapi = await tdToOpenAPI(thing.description)

  return openapi.json
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  findOneOpenApi,
  update
}
