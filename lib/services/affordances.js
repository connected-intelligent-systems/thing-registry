'use strict'

const models = require('../models')

async function find (accessToken, query) {
  const thingIds = await models.resource.find({
    type: models.resource.ResourceTypes.Thing,
    name: query.thingId,
    exactName: query.thingId !== undefined
  })

  if (thingIds.length === 0) {
    return []
  }

  const permittedThingIds = await models.access.check({
    resource: thingIds,
    token: accessToken.token,
    scopes: ['read'],
    namesOnly: true
  })

  // user does not have permissions for any affordance
  if (permittedThingIds === undefined) {
    return []
  }

  return models.affordances.findByIds(permittedThingIds, query)
}

exports = module.exports = {
  find
}
