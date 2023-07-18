'use strict'

const {
  PrismaClient,
  ThingAuthorizationScope,
  AffordanceAuthorizationScope,
  Prisma
} = require('@prisma/client')

const prisma = new PrismaClient().$extends({
  model: {
    $allModels: {
      async exists (where) {
        const context = Prisma.getExtensionContext(this)
        const result = await context.findFirst({ where })
        console.log('exists', { result })
        return result !== null
      }
    }
  }
})

exports = module.exports = {
  prisma,
  ThingAuthorizationScope,
  AffordanceAuthorizationScope
}
