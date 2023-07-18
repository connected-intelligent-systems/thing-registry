'use strict'

const { PrismaClient, ThingAuthorizationScope } = require('@prisma/client')
const prisma = new PrismaClient()

async function find (accessToken, query) {
  // todo: implement query
  const { sub } = accessToken.content
  const affordances = await prisma.affordance.findMany({
    where: {
      OR: [
        { owner: sub },
        {
          AffordanceAuthorizations: {
            some: {
              Affordance: {
                Thing: {
                  ThingAuthorizations: {
                    every: {
                      entityId: sub,
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

  return affordances
}

exports = module.exports = {
  find
}
