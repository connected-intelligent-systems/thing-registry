'use strict'

const models = require('../models')
const { InsufficientPermissions } = require('../utils/http_errors')

async function authorize ({ id: thingId, type, name, index, authorized, sub }) {
  const isOwner = await models.thing.isOwner(thingId, sub)
  if (isOwner === true) {
    return models.target.authorize({
      thingId,
      type,
      name,
      index,
      authorized
    })
  } else {
    throw new InsufficientPermissions()
  }
}

async function find (id, sub, { session } = {}) {
  const isOwner = await models.thing.isOwner(id, sub)
  if (isOwner === true) {
    return models.target.find(id, { session })
  } else {
    throw new InsufficientPermissions()
  }
}

async function findOne ({ id: thingId, type, name, index, sub }) {
  const isOwner = await models.thing.isOwner(thingId, sub)
  if (isOwner === true) {
    return models.target.findOne({ thingId, type, name, index })
  } else {
    throw new InsufficientPermissions()
  }
}

exports = module.exports = {
  authorize,
  find,
  findOne
}
