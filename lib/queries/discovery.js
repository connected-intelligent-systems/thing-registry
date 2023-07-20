'use strict'

const { prisma } = require('../utils/prisma')

async function isDiscoveryRunning (user) {
  return prisma.discovery.findFirst({
    where: {
      user,
      running: true
    }
  })
}

exports = module.exports = {
  isDiscoveryRunning
}
