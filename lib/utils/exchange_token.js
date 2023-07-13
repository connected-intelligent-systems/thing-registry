'use strict'

const fetch = require('node-fetch')
const { default: urlencode } = require('form-urlencoded')

const { KeycloakHost, KeycloakRealm, ResourceClientId, ResourceClientSecret } = require("./keycloak")

async function exchangeToken (token) {
  const response = await fetch(
    `${KeycloakHost}/auth/realms/${KeycloakRealm}/protocol/openid-connect/token`,
    {
      method: 'POST',
      body: urlencode({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        client_id: ResourceClientId,
        client_secret: ResourceClientSecret,
        subject_token: token,
        audience: ResourceClientId
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!response.ok) {
    throw Error('Could not exchange token')
  }

  const json = await response.json()
  return json['access_token']
}

exports = module.exports = exchangeToken
