'use strict'

const { prisma } = require('../utils/prisma')

async function updateDiscoveredThings ({ owner, discoveredThings }) {
  return prisma.$transaction([
    prisma.discoveredThing.deleteMany({
      where: {
        owner
      }
    }),
    prisma.discoveredThing.createMany({
      data: discoveredThings
    })
  ])
}

async function getDiscoveredThings ({ owner, resolve = false }) {
  return prisma.discoveredThing.findMany({
    where: {
      owner
    },
    select: {
      id: true,
      description: resolve,
      foundAt: true,
      source: true,
      owner: false
    }
  })
}

async function getDiscoveredThingsByIds (owner, ids) {
  return prisma.discoveredThing.findMany({
    where: {
      owner,
      id: {
        in: ids
      }
    }
  })
}

async function getDiscoveredThing (owner, id) {
  return prisma.discoveredThing.findFirst({
    where: {
      owner,
      id
    }
  })
}

exports = module.exports = {
  updateDiscoveredThings,
  getDiscoveredThings,
  getDiscoveredThingsByIds,
  getDiscoveredThing
}
