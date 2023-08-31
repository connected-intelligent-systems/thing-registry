'use strict'

const { prisma } = require('../db')
const { ThingNotFound } = require('../utils/http_errors')

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
        publicDescription: query.resolve === true,
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
    things: things.map(({ publicDescription, ...thing }) => ({
      ...thing,
      description: publicDescription
    }))
  }
}

async function findOne (id, tenantId) {
  const thing = await prisma.thing.findFirst({
    where: {
      id,
      tenantId
    },
    select: {
      publicDescription: true
    }
  })

  if (thing === null) {
    throw new ThingNotFound()
  }

  return thing
}

exports = module.exports = {
  find,
  findOne
}
