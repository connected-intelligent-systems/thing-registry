'use strict'

const {
  PrismaClient,
  PermissionScope,
  AffordanceType,
  Prisma
} = require('@prisma/client')

const prisma = new PrismaClient()

exports = module.exports = {
  prisma,
  PermissionScope,
  AffordanceType
}
