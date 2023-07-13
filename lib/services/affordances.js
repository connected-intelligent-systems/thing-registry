'use strict'

const models = require('../models')

async function find (accessToken, query) {
  const permittedThingIds = await models.access.check({
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
