'use strict'

const models = require('../models')

async function checkPermissions ({ id, scope, accessToken }) {
  const resourceId = await models.resource.find({
    name: id,
    exactName: true
  })

  if (resourceId.length === 0) {
    throw new DescriptionNotFound()
  }

  const result = await models.access.check({
    resource: resourceId[0],
    scopes: [scope],
    token: accessToken.token
  })

  if (result === undefined) {
    throw new InsufficientPermissions()
  }

  return true
}

async function list ({ resourceType, accessToken }) {
  const permittedThingIds = await models.access.check({
    resourceType,
    scopes: ['read'],
    token: accessToken.token,
    namesOnly: true
  })

  return permittedThingIds
}

async function createResources ({ id, targets, user }) {
  return Promise.all([
    models.resource.createAffordances(targets, user),
    models.resource.createThing(id, user)
  ])
}

async function deleteResources (id) {
  return models.resource.deleteMany(id)
}

async function updateResources ({ id, targets }) {
  const { name: user } = await models.resource.getOwner(id)
  return models.resource.updateResources(id, user, targets)
}

async function hasReadPermissions ({ id, accessToken }) {
  return checkPermissions({ id, scope: 'read', accessToken })
}

async function hasWritePermissions ({ id, accessToken }) {
  return checkPermissions({ id, scope: 'write', accessToken })
}

async function hasDeletePermissions ({ id, accessToken }) {
  return checkPermissions({ id, scope: 'delete', accessToken })
}

async function listThings ({ accessToken }) {
  return list({
    resourceType: models.resource.ResourceTypes.Thing,
    accessToken
  })
}

async function listAffordances ({ accessToken }) {
  return list({
    resourceType: models.resource.ResourceTypes.Affordance,
    accessToken
  })
}

exports = module.exports = {
  createResources,
  deleteResources,
  updateResources,
  listThings,
  listAffordances,
  hasDeletePermissions,
  hasReadPermissions,
  hasWritePermissions
}
