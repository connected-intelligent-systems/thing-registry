'use strict'

const { prisma } = require('../utils/prisma')

async function isOwnerOfThing ({ owner, thingId }) {
  return prisma.thing.findFirst({
    where: {
      owner,
      id: thingId
    }
  })
}

// TODO: how to check if user exists?
async function createPermission (
  owner,
  { entityId, entityType, thingId, scope }
) {
  const isOwner = await isOwnerOfThing({ owner, thingId })
  if (isOwner) {
    await prisma.permission.create({
      data: {
        entityId,
        entityType,
        thingId,
        scope
      }
    })
  }
}

async function removePermission ({ owner, id }) {
  return prisma.permission.deleteMany({
    where: {
      id,
      Thing: {
        owner
      }
    }
  })
}

async function getPermissions (owner) {
  return prisma.permission.findMany({
    where: {
      Thing: {
        owner
      }
    }
  })
}

async function getPermission ({ owner, id }) {
  return prisma.permission.findFirst({
    where: {
      id,
      Thing: {
        owner
      }
    }
  })
}

exports = module.exports = {
  createPermission,
  removePermission,
  getPermissions,
  getPermission
}
