'use strict'

const env = require('env-var')
const { createRemoteJWKSet, jwtVerify, decodeJwt } = require('jose')

const KeycloakHost = env.get('KEYCLOAK_HOST').asString()
const KeycloakRealm = env.get('KEYCLOAK_REALM').asString()
const DisableTokenVerification = env
  .get('DISABLE_TOKEN_VERIFICATION')
  .default('true')
  .asBool()
const jwks = createJWKSet()

function createJWKSet () {
  if (DisableTokenVerification === false) {
    return createRemoteJWKSet(
      new URL(
        `${KeycloakHost}/realms/${KeycloakRealm}/protocol/openid-connect/certs`
      )
    )
  } else {
    console.warn('Token verification is off!')
  }
}

function decodeToken (token) {
  if (DisableTokenVerification === false) {
    return jwtVerify(token, jwks)
  }
  return decodeJwt(token)
}

exports = module.exports = {
  KeycloakHost,
  KeycloakRealm,
  decodeToken
}
