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

exports = module.exports = {
  hasThingReadAccess,
  hasAffordanceExecuteAccess
}
