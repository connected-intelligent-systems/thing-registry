'use strict'

'use strict'

const models = require('../models')
const { InsufficientPermissions } = require('../utils/http_errors')

async function authorize ({ id: thingId, type, name, index, authorized, user }) {
  const isOwner = await models.resource.isOwner(user, thingId)
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

async function find (id, user, { session } = {}) {
  const isOwner = await models.resource.isOwner(user, id)
  if (isOwner === true) {
    return models.target.find(id, { session })
  } else {
    throw new InsufficientPermissions()
  }
}

async function findOne ({ id: thingId, type, name, index, user }) {
  const isOwner = await models.resource.isOwner(user, thingId)
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
