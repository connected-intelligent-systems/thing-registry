'use strict'

const models = require('../models')
const { ThingNotFound } = require('../utils/http_errors')

/**
 * Returns the permissions the current user have for the thing
 * @param {string} id - The id of the thing
 * @param {object} accessToken - The valid access token from the middleware
 */
async function findOne (id, accessToken) {
  const permissions = await models.permissions.evaluatePermissions({
    entityId: accessToken.content.sub,
    thingIds: [id]
  })

  if (permissions === undefined || permissions.length === 0) {
    throw new ThingNotFound()
  }

  return permissions
}

exports = module.exports = {
  findOne
}
