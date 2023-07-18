'use strict'

const { prisma, AffordanceType } = require('../utils/prisma')

function convertAffordanceType (type) {
  switch (type) {
    case 'properties':
      return AffordanceType.property
    case 'events':
      return AffordanceType.event
    case 'actions':
      return AffordanceType.action
  }
}

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
