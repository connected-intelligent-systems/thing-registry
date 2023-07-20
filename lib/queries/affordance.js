'use strict'

const { prisma, PermissionScope } = require('../utils/prisma')

// FIXME: this is a mess
async function getAffordances (owner) {
  return prisma.affordance.findMany({
    where: {
      OR: [
        { owner },
        {
          Permissions: {
            some: {
              Affordance: {
                Thing: {
                  Permissions: {
                    every: {
                      entityId: owner,
                      scope: PermissionScope.read
                    }
                  }
                }
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
