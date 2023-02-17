'use strict'

const models = require('../models')

/**
 * Filters the things from the permissions
 * @param {array} permissions - Returned permissions array from the keycloak authz endpoint
 * @returns {array} - Array of things
 */
function getThingsFromPermissions (permissions) {
  return permissions
    .filter(
      p =>
        p.claims !== undefined &&
        p.claims.resourceType[0] !== 'urn:wot:resources:thing'
    )
    .map(p => p.rsname)
}

async function find (accessToken, query) {
  const permissions = await models.access.check({
    token: accessToken.token,
    scopes: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE']
  })

  // user does not have permissions for any affordance
  if (permissions === undefined) {
    return []
  }

  return models.affordances.findByIds(
    getThingsFromPermissions(permissions),
    query
  )
}

exports = module.exports = {
  find
}
