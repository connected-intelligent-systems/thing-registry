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
const { getTypes } = require('../utils/thing_description')
const {
  sendCreateEvent,
  sendRemoveEvent,
  sendUpdateEvent,
  sendAssignEvent
} = require('./events')
const fuseki = require('../utils/fuseki')

/**
 * Creates a new thing with the provided description.
 *
 * @param {object} description - The description of the thing.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<object>} - A promise that resolves to the created thing.
 * @throws {ThingAlreadyExists} - If a thing with the same ID already exists.
 * @throws {InvalidDescription} - If the description is invalid and validation is not skipped.
 */
async function create (description, tenantId, customerId) {
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
    throw new InvalidDescription(validate.errors)
  }

  addDefaults(description)

  const createdThing = await prisma.$transaction(async tx => {
    const createdThing = await tx.thing.create({
      data: {
        id: description.id,
        tenantId,
        customerId,
        title: description.title,
        types: getTypes(description),
        description
      }
    })

    if (fuseki.isSyncEnabled()) {
      await fuseki.addThingDescriptions({
        description: createdThing.description,
        tenantId,
        customerId
      })
    }

    return createdThing
  })

  sendCreateEvent(createdThing, tenantId)

  return createdThing
}

/**
 * Removes a thing from the registry.
 *
 * @param {string} id - The ID of the thing to remove.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @throws {ThingNotFound} If the thing is not found.
 * @returns {Promise<void>} A promise that resolves when the thing is successfully removed.
 */
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

    if (fuseki.isSyncEnabled()) {
      await fuseki.removeThingDescriptions({
        id,
        tenantId,
        customerId: deletedThing.customerId
      })
    }
  })

  sendRemoveEvent(thing, tenantId)
}

/**
 * Updates a thing with the provided description, tenant ID, and customer ID.
 * @param {object} description - The updated description of the thing.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<object>} - A promise that resolves to the updated thing.
 * @throws {ThingNotFound} - If the thing is not found.
 * @throws {InvalidDescription} - If the description is invalid.
 */
async function update (description, tenantId, customerId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id: description.id,
      tenantId,
      customerId
    },
    select: {
      id: true,
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
        description
      }
    })

    if (fuseki.isSyncEnabled()) {
      await fuseki.addThingDescriptions({
        description: updatedThing.description,
        tenantId,
        customerId
      })
    }

    return updatedThing
  })

  sendUpdateEvent(updatedThing, tenantId)

  return updatedThing
}

/**
 * Finds things based on the provided parameters.
 *
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @param {object} query - The query parameters.
 * @param {string[]} query.type - The types of things to filter by.
 * @param {boolean} query.resolve - Indicates whether to include the description in the response.
 * @param {number} query.page - The page number.
 * @param {number} query.page_size - The number of things per page.
 * @returns {Promise<object>} - The result of the find operation.
 */
async function find (tenantId, customerId, query) {
  const [totalCount, things] = await prisma.$transaction([
    prisma.thing.count({
      where: {
        tenantId,
        customerId,
        ...(query.type && { types: { hasSome: query.type } })
      }
    }),
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
      take: query.page_size,
      orderBy: {
        [query.sort_by]: query.sort_order
      }
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

/**
 * Finds a thing by its ID, tenant ID, and customer ID.
 * @param {string} id - The ID of the thing.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<Object>} - A promise that resolves to the found thing.
 * @throws {ThingNotFound} - If the thing is not found.
 */
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

/**
 * Finds a Thing in the registry by ID and converts its description to OpenAPI format.
 * @param {string} id - The ID of the Thing to find.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the customer.
 * @returns {Promise<object>} A Promise that resolves to the OpenAPI JSON representation of the Thing's description.
 */
async function findOneOpenApi (id, tenantId, customerId) {
  const thing = await findOne(id, tenantId, customerId)
  const openapi = await tdToOpenAPI(thing.description)

  return openapi.json
}

/**
 * Assigns a new customer to a thing.
 *
 * @param {string} id - The ID of the thing.
 * @param {string} tenantId - The ID of the tenant.
 * @param {string} customerId - The ID of the current customer.
 * @param {string} newCustomerId - The ID of the new customer to assign.
 * @throws {ThingNotFound} If the thing is not found.
 * @returns {Promise<void>} A promise that resolves when the customer is assigned.
 */
async function assignCustomer (id, tenantId, customerId, newCustomerId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id,
      tenantId,
      customerId
    },
    select: {
      id: true,
      customerId: true,
      description: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  await prisma.$transaction(async tx => {
    await tx.thing.update({
      where: {
        id,
        tenantId,
        customerId
      },
      data: {
        customerId: newCustomerId
      }
    })

    if (fuseki.isSyncEnabled()) {
      await fuseki.removeThingDescriptions({
        id,
        tenantId,
        customerId
      })

      await fuseki.addThingDescriptions({
        description: thing.description,
        tenantId,
        customerId: newCustomerId
      })
    }
  })

  sendAssignEvent(thing, tenantId, newCustomerId)
}

exports = module.exports = {
  create,
  remove,
  find,
  findOne,
  findOneOpenApi,
  update,
  assignCustomer
}
