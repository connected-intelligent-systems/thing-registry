'use strict'

const {
  PrismaClient,
  PermissionScope,
  AffordanceType,
  Prisma
} = require('@prisma/client')

const prisma = new PrismaClient()

prisma.$extends({
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
  PermissionScope,
  AffordanceType
}
