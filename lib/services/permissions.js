'use strict'

const models = require('../models')
const {
  ThingNotFoundError,
  TicketsNotFound,
  InvalidTicket
} = require('../utils/http_errors')

async function find({ thingId }, accessToken) {
  return models.permissions.find({
      owner: accessToken.content.sub,
      thingId
  })
}

async function insert(thingId, requesterName, scope, accessToken) {
  const { sub : owner } = accessToken.content
  const permission = await models.thing.isOwner(thingId, owner)

  if(permission === false) {
    throw new ThingNotFoundError()
  }

  return models.permissions.create({
    thingId, 
    entityId: requesterName,
    owner: accessToken.content.sub,
    scopes: scope
  })
}

async function remove(id, accessToken) {
  const { sub : owner } = accessToken.content
  const permission = await models.thing.isOwner(thingId, owner)

  if(permission === false) {
    throw new ThingNotFoundError()
  }

  return models.permissions.delete(id)
}

exports = module.exports = {
  find,
  insert,
  delete: remove
}
