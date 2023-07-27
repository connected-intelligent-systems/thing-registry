'use strict'

const env = require('env-var')
const jwt = require('jsonwebtoken')
const {
  InternalServerError,
  UnknownEntityName
} = require('./http_errors')

const KeycloakHost = env.get('KEYCLOAK_HOST').asString()
const KeycloakRealm = env.get('KEYCLOAK_REALM').asString()

const ResourceClientId = env.get('RESOURCE_CLIENT_ID').asString()
const ResourceClientSecret = env.get('RESOURCE_CLIENT_SECRET').asString()
const ResourceServerAudience = env.get('RESOURCE_SERVER_AUDIENCE').asString()

let accessToken
let refreshToken

/**
 * Checks if a jwt token is expired
 * @param {string} token - jwt access token to check
 */
function isExpired (token) {
  if (token === undefined || Date.now() >= token.content.exp * 1000) {
    return true
  }
  return false
}

/**
 * Decodes both access and refresh token and stores it
 * @param {string} json - answer from authentication
 */
function storeTokens (json) {
  if (json.access_token !== undefined) {
    accessToken = {
      token: json.access_token,
      content: jwt.decode(json.access_token)
    }
  }
  if (json.refresh_token !== undefined) {
    refreshToken = {
      token: json.refresh_token,
      content: jwt.decode(json.refresh_token)
    }
  }
}

/**
 * Refreshes a access token
 */
async function refreshAccessToken () {
  const response = await fetch(
    `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/token`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: formurlencoded({
        client_id: ResourceClientId,
        client_secret: ResourceClientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken.token
      })
    }
  )

  if (!response.ok) {
    throw Error('Unable to refresh access token')
  }

  return response.json()
}

/**
 * Authenticate via the client_id and client_secret.
 * Requires the view_user realm_management role for the client service account.
 */
async function authenticate () {
  try {
    const response = await fetch(
      `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: ResourceClientId,
          client_secret: ResourceClientSecret
        })
      }
    )

    if (!response.ok) {
      throw new InternalServerError()
    }

    return response.json()
  } catch (error) {
    throw new InternalServerError()
  }
}

/**
 * Returns a valid access token. Refreshes and authenticates if necessary
 */
async function getAccessToken () {
  if (isExpired(accessToken)) {
    let tokenData
    if (isExpired(refreshToken)) {
      tokenData = await authenticate()
    } else {
      tokenData = await refreshAccessToken()
    }
    storeTokens(tokenData)
  }
  return accessToken.token
}

async function getUserIdFromUsername (username) {
  try {
    const accessToken = await getAccessToken()
    const response = await fetch(
      `${KeycloakHost}/admin/realms/${KeycloakRealm}/users?username=${username}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const users = await response.json()
    if (users.length === 0) {
      throw new UnknownEntityName()
    }

    return users[0]
  } catch (error) {
    throw error
  }
}

async function getGroupIdFromGroupName (groupname) {
  try {
    const accessToken = await getAccessToken()
    const response = await fetch(
      `${KeycloakHost}/admin/realms/${KeycloakRealm}/groups?search=${groupname}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const groups = await response.json()
    if (groups.length === 0) {
      throw new UnknownEntityName()
    }

    return groups[0]
  } catch (error) {
    throw error
  }
}

exports = module.exports = {
  KeycloakHost,
  KeycloakRealm,
  ResourceClientId,
  ResourceClientSecret,
  ResourceServerAudience,
  getUserIdFromUsername,
  getGroupIdFromGroupName
}
