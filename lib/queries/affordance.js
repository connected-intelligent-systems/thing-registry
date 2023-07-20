'use strict'

const { prisma, PermissionScope } = require('../utils/prisma')

async function getAffordances (owner) {
  return prisma.affordance.findMany({
    where: {
      OR: [
        { owner },
        {
          Thing: {
            Permissions: {
              some: {
                entityId: owner,
                scope: PermissionScope.read
              }
            }
          }
        }
      ]
    },
    select: {
      id: true,
      type: true,
      name: true,
      types: true,
      thingId: true,
      source: false,
      description: false
      // Thing: {
      //   select: {
      //     description: true
      //   }
      // }
    }
  })
}

exports = module.exports = {
  getAffordances
}
