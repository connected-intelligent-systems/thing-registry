'use strict'

const { prisma } = require('../utils/prisma')

async function updateDiscovery (owner, running) {
  return prisma.discovery.upsert({
    where: {
      user: owner
    },
    update: {
      running
    },
    create: {
      user: owner,
      running
    }
  })
}

async function isDiscoveryRunning (user) {
  return prisma.discovery.exists({
    user,
    running: true
  })
}

exports = module.exports = {
  updateDiscovery,
  isDiscoveryRunning
}
