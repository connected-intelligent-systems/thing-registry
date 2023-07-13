'use strict'

const fetch = require('node-fetch')
const jwt = require('jsonwebtoken')
const queryString = require('query-string')

const {
  KeycloakHost,
  KeycloakRealm,
  ResourceServerAudience
} = require('../utils/keycloak')

/**
 * Find permissions for the current user
 */
async function find ({ token }) {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/authz/protection/uma-policy`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      method: 'GET'
    }
  )

  if (!response.ok) {
    throw new Error('Error creating permission')
  }

  return response.json()
}

/**
 * Build the scopes part of the permission parameter
 */
function buildScopes (scopes) {
  if (scopes !== undefined) {
    return `${scopes.join(',')}`
  } else {
    return ''
  }
}

/**
 * Build the permission parameter for the policy enforcer
 */
function buildPermission (resource, scopes) {
  // are there multiple resources to check
  if (Array.isArray(resource)) {
    return resource.map((r, index) => {
      // are there multiple scopes ?
      if (scopes !== undefined && Array.isArray(scopes[0])) {
        return `${r}#${buildScopes(scopes[index])}`
      }
      return `${r}#${buildScopes(scopes)}`
    })
  } else if (resource !== undefined) {
    return `${resource}#${buildScopes(scopes)}`
  } else {
    if (scopes !== undefined) {
      return `#${buildScopes(scopes)}`
    }
    // if nothing is specified return undefined
  }
}

/**
 * Check if a permission to a resource is granted
 */
async function check ({ resource, scopes, token, namesOnly } = {}) {
  const body = queryString.stringify({
    audience: ResourceServerAudience,
    grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
    permission: buildPermission(resource, scopes),
    response_include_resource_name: true
  })
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${token}`
      }
    }
  )

  if (response.ok) {
    const json = await response.json()
    const authzToken = jwt.decode(json.access_token)
    let permissions = authzToken.authorization.permissions
    if (namesOnly === true) {
      permissions = permissions.map(permission => permission.rsname)
    }
    return permissions
  }
}

exports = module.exports = {
  find,
  check
}
