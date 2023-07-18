'use strict'

const { prisma } = require('../utils/prisma')

async function updateDiscoveredThings (owner, discoveredThings) {
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

exports = module.exports = {
  updateDiscoveredThings
}
