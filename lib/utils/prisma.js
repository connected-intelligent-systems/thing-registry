'use strict'

const {
  PrismaClient,
  PermissionScope,
  AffordanceType
} = require('@prisma/client')

const prisma = new PrismaClient()

exports = module.exports = {
  prisma,
  PermissionScope,
  AffordanceType
}
