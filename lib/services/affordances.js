'use strict'

const models = require('../models')

/**
 * Return all readable affordances of the current user
 * @param {object} accessToken - The valid access token from the middleware
 * @param {object} query - Query parameters from the url to filter the query
 */
async function find (accessToken, query) {
  const { sub } = accessToken.content
  const readablePermissions = await models.permissions.listReadableThings({
    entityId: sub,
    thingIds: query.thingId
  })

  return models.affordances.findByIds(
    readablePermissions.map(e => e.thingId) || [],
    query
  )
}

exports = module.exports = {
  find
}
