'use strict'

const models = require('../models')

async function find (accessToken, query) {
  const { sub } = accessToken.content
  const readablePermissions = await models.permissions.listReadableThings({
    entityId: sub
  })

  return models.affordances.findByIds(
    readablePermissions.map(e => e.thingId) || [],
    query
  )
}

exports = module.exports = {
  find
}
