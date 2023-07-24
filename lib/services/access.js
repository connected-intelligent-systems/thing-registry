'use strict'

const models = require('../models')
const { ThingNotFoundError } = require('../utils/http_errors')

async function findOne (id, accessToken) {
  const permissions = await models.permissions.findOne({
    entityId: accessToken.content.sub,
    thingId: id
  })

  if (permissions === undefined || permissions.length === 0) {
    throw new ThingNotFoundError()
  }

  return permissions.flatMap(permission => permission.scopes)
}

exports = module.exports = {
  findOne
}
