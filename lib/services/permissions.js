'use strict'

const {
  prisma,
  ThingAuthorizationScope,
  AffordanceAuthorizationScope
} = require('../utils/prisma')

async function hasThingReadAccess (thingId, user) {
  const access = await prisma.thingAuthorization.findFirst({
    where: {
      AND: [
        { thingId },
        { entityId: user },
        { scope: ThingAuthorizationScope.read }
      ]
    }
  })
  return access !== undefined
}

async function hasAffordanceExecuteAccess (affordanceId, user) {
  const access = await prisma.affordanceAuthorization.findFirst({
    where: {
      AND: [
        { affordanceId },
        { entityId: user },
        { scope: AffordanceAuthorizationScope.execute }
      ]
    }
  })
  return access !== undefined
}

async function findOne (id, accessToken) {
  const { sub } = accessToken.content
  const results = await prisma.thing.findFirst({
    where: { id },
    select: {
      ThingAuthorizations: {
        where: {
          entityId: sub
        }
      },
      Affordances: {
        select: {
          AffordanceAuthorizations: {
            where: {
              entityId: sub
            }
          }
        }
      }
    }
  })

  // todo: reorder
  return results
}

exports = module.exports = {
  findOne,
  hasThingReadAccess,
  hasAffordanceExecuteAccess
}
