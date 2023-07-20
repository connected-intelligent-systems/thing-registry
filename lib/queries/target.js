'use strict'

const { prisma } = require('../utils/prisma')
const { convertAffordanceType } = require('../utils/thing_description')

async function getTarget (thingId, index, name, type) {
  return prisma.target.findFirst({
    where: {
      thingId,
      index: +index,
      name,
      type: convertAffordanceType(type)
    }
  })
}

exports = module.exports = {
  getTarget
}
