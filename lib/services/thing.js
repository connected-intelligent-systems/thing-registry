'use strict'

const { v4: uuidv4 } = require('uuid')
const tdToOpenAPI = require('@thing-description-playground/td_to_openapi')
const { addDefaults } = require('@thing-description-playground/defaults')
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
const fuseki = require('../utils/fuseki')

async function create (description, tenantId, customerId, options = {}) {
  const { skipValidation = false } = options

  // automatically generate a thing.id if there is none
  if (description.id === undefined) {
    description.id = `urn:uuid:${uuidv4()}`
  }

  // don't add customerId here. thing ids need to be unqiue in the tenant domain
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

  const createdThing = await prisma.$transaction(async tx => {
    const createdThing = await tx.thing.create({
      data: {
        id: description.id,
        tenantId,
        customerId,
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

    await fuseki.addThingDescriptions({
      description: createdThing.description,
      publicDescription: createdThing.publicDescription,
      tenantId,
      customerId
    })

    return createdThing
  })

  sendCreateEvent(createdThing, tenantId)

  return createdThing
}

async function remove (id, tenantId, customerId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id,
      tenantId,
      customerId
    },
    select: {
      id: true,
      tenantId: true,
      customerId: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  await prisma.$transaction(async tx => {
    const deletedThing = await tx.thing.delete({
      where: {
        id,
        tenantId
      }
    })

    await fuseki.removeThingDescriptions({
      id,
      tenantId,
      customerId: deletedThing.customerId
    })
  })

  sendRemoveEvent(thing, tenantId)
}

async function update (description, tenantId, customerId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id: description.id,
      tenantId,
      customerId
    },
    select: {
      id: true,
      source: true,
      customerId: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  if (validate(description) === false) {
    throw new InvalidDescription(validate.errors)
  }

  addDefaults(description)

  const securityDefinitions = getSecurityDefinitions(
    description,
    thing.customerId
  )

  const updatedThing = await prisma.$transaction(async tx => {
    const updatedThing = await tx.thing.update({
      where: {
        id: description.id,
        tenantId,
        customerId
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
                customerId: thing.customerId,
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
                  customerId: thing.customerId,
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

    await fuseki.addThingDescriptions({
      description: updatedThing.description,
      publicDescription: updatedThing.publicDescription,
      tenantId,
      customerId
    })

    return updatedThing
  })

  sendUpdateEvent(updatedThing, tenantId)
}

async function find (tenantId, customerId, query) {
  const [totalCount, things] = await prisma.$transaction([
    prisma.thing.count({ where: { tenantId, customerId } }),
    prisma.thing.findMany({
      where: {
        tenantId,
        customerId,
        ...(query.type && { types: { hasSome: query.type } })
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
    totalCount,
    things
  }
}

async function findOne (id, tenantId, customerId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id,
      tenantId,
      customerId
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

async function findOneOpenApi (id, tenantId, customerId) {
  const thing = await findOne(id, tenantId, customerId)
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
