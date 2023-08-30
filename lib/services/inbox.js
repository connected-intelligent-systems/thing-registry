'use strict'

const { prisma } = require('../db')
const { ThingNotFoundError } = require('../utils/http_errors')
const thingService = require('./thing')

async function find (tenantId, query) {
  const [totalCount, things] = await prisma.$transaction([
    prisma.discoveredThing.count({ where: { tenantId } }),
    prisma.discoveredThing.findMany({
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
  return prisma.discoveredThing.findFirst({
    where: {
      tenantId,
      id
    }
  })
}

async function approve (id, tenantId) {
  const thing = await prisma.discoveredThing.findFirst({
    where: {
      tenantId,
      id
    }
  })

  if (thing === null) {
    throw new ThingNotFoundError()
  }

  await thingService.create(thing.description, tenantId, {
    skipValidation: true,
    source: thing.source
  })

  await prisma.discoveredThing.delete({
    where: {
      tenantId,
      id
    }
  })
}

exports = module.exports = {
  find,
  findOne,
  approve
}
