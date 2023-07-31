'use strict'

const models = require('../models')
const { ThingNotFound } = require('../utils/http_errors')
const {
  getUserIdFromUsername,
  getGroupIdFromGroupName
} = require('../utils/keycloak')
const toArray = require('../utils/to_array')

async function find (query, accessToken) {
  const { entityName } = query
  if (entityName !== undefined) {
    if (query.entityName.includes('@')) {
      query.entityId = await getUserIdFromUsername(entityName)
    } else {
      query.entityId = await getGroupIdFromGroupName(entityName)
    }
  }
  const [permissions] = await models.permissions.find({
    owner: accessToken.content.sub,
    ...query
  })
  const totalPages = permissions
    ? Math.ceil(permissions.totalCount.count / query.page_size)
    : 0

  return {
    page: query.page,
    pageSize: query.page_size,
    totalPages,
    hasNextPage: query.page < totalPages,
    permissions: permissions ? permissions.entries : []
  }
}

async function insert (permission, accessToken) {
  const { sub: owner } = accessToken.content
  const isThingOwner = await models.thing.isOwner(permission.thingId, owner)

  // Throw 422
  if (isThingOwner === false) {
    throw new ThingNotFound()
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
  const permission = await models.permissions.isOwner(id, owner)

  if (permission === false) {
    throw new ThingNotFound()
  }

  return models.permissions.delete(id)
}

async function findOne (id, accessToken) {
  const { sub: owner } = accessToken.content
  const result = await models.permissions.findOne(id, owner)

  if (result === null) {
    return new ThingNotFound()
  }

  return result
}

async function evalPermissions (query, accessToken) {
  const { thing_id: thingId, scope, property, action, event } = query
  const result = await models.permissions.findUnpaginated({
    thingIds: thingId,
    scope: scope,
    properties: property,
    actions: action,
    events: event,
    entityId: accessToken.content.sub
  })
  return result.map(({ thingId }) => thingId)
}

exports = module.exports = {
  find,
  insert,
  delete: remove,
  findOne,
  eval: evalPermissions
}
