'use strict'

const { prisma } = require('../utils/prisma')

async function isDiscoveryRunning (user) {
  return prisma.discovery.exists({
    user,
    running: true
  })
}

exports = module.exports = {
  isDiscoveryRunning
}
