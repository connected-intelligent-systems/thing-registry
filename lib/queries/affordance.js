'use strict'

const { prisma, ThingAuthorizationScope } = require('../utils/prisma')

// FIXME: this is a mess
async function getAffordances (owner) {
  return prisma.affordance.findMany({
    where: {
      OR: [
        { owner },
        {
          AffordanceAuthorizations: {
            some: {
              Affordance: {
                Thing: {
                  ThingAuthorizations: {
                    every: {
                      entityId: owner,
                      scope: ThingAuthorizationScope.read
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
