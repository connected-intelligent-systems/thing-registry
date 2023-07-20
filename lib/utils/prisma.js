'use strict'

const {
  PrismaClient,
  ThingAuthorizationScope,
  AffordanceAuthorizationScope,
  AffordanceType,
  Prisma
} = require('@prisma/client')

const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async exists (where) {
        const context = Prisma.getExtensionContext(this)
        const result = await context.findFirst({ where })
        return result !== null
      }
    }
  }
})

exports = module.exports = {
  prisma,
  ThingAuthorizationScope,
  AffordanceAuthorizationScope,
  AffordanceType
}
