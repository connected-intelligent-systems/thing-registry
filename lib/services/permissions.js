'use strict'

const models = require('../models')
const { ThingNotFoundError } = require('../utils/http_errors')
const {
  getUserIdFromUsername,
  getGroupIdFromGroupName
} = require('../utils/keycloak')

async function find ({ thingId }, accessToken) {
  return models.permissions.find({
    owner: accessToken.content.sub,
    thingId
  })
}

async function insert (permission, accessToken) {
  const { sub: owner } = accessToken.content
  const isThingOwner = await models.thing.isOwner(permission.thingId, owner)

  if (isThingOwner === false) {
    throw new ThingNotFoundError()
  }

  // get the entity id from the keycloak service
  if (permission.entityName.includes('@')) {
    permission.entityId = await getUserIdFromUsername(permission.entityName)
  } else {
    permission.entityId = await getGroupIdFromGroupName(permission.entityName)
  }

  return models.permissions.create({
    ...permission,
    owner: accessToken.content.sub
  })
}

async function remove (id, accessToken) {
  const { sub: owner } = accessToken.content
  const permission = await models.thing.isOwner(id, owner)

  if (permission === false) {
    throw new ThingNotFoundError()
  }

  return models.permissions.delete(id)
}

exports = module.exports = {
  find,
  insert,
  delete: remove
}
