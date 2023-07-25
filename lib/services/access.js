'use strict'

const models = require('../models')
const { ThingNotFoundError } = require('../utils/http_errors')

/**
 * Returns the permissions the current user have for the thing
 * @param {string} id - The id of the thing
 * @param {object} accessToken - The valid access token from the middleware
 */
async function findOne (id, accessToken) {
  const permissions = await models.permissions.findOne({
    entityId: accessToken.content.sub,
    thingId: id
  })

  if (permissions === undefined || permissions.length === 0) {
    throw new ThingNotFoundError()
  }

  return {
    scopes: permissions.flatMap(permission => permission.scopes),
    properties: permissions.flatMap(permission => permission.properties),
    actions: permissions.flatMap(permission => permission.actions),
    events: permissions.flatMap(permission => permission.events)
  }
}

exports = module.exports = {
  findOne
}
