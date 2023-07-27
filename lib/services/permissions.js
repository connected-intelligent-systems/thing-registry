'use strict'

const models = require('../models')
const { ThingNotFoundError } = require('../utils/http_errors')
const {
  getUserIdFromUsername,
  getGroupIdFromGroupName
} = require('../utils/keycloak')

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
